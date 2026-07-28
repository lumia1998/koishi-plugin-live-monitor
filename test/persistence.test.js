const assert = require('node:assert/strict')
const test = require('node:test')

const plugin = require('../lib/index.js')

function createDatabase() {
  const tables = new Map()
  const tableRows = (table) => {
    if (!tables.has(table)) tables.set(table, new Map())
    return tables.get(table)
  }
  return {
    get rows() { return tableRows('liveMonitorState') },
    tableRows,
    async get(table, query = {}) {
      return [...tableRows(table).values()]
        .filter(row => Object.entries(query).every(([key, value]) => row[key] === value))
        .map(row => ({ ...row }))
    },
    async upsert(table, values) {
      const rows = tableRows(table)
      for (const value of values) rows.set(value.id, { ...value })
    },
  }
}

function createContext(database, status, messages) {
  const readyHandlers = []
  const command = {
    alias() { return command },
    option() { return command },
    action() { return command },
  }
  const logger = { debug() {}, warn() {}, info() {}, error() {} }

  return {
    database,
    model: { extend() {} },
    bots: [{
      platform: 'test',
      async sendMessage(channelId, content) {
        messages.push({ channelId, content })
      },
    }],
    http: {
      async post(url) {
        if (url.endsWith('/api/check/batch')) return { rooms: [{ ...status }] }
        return { ...status }
      },
    },
    logger() { return logger },
    on(event, callback) {
      if (event === 'ready') readyHandlers.push(callback)
    },
    setInterval() {},
    command() { return command },
    async start() {
      for (const callback of readyHandlers) await callback()
    },
  }
}

function createConfig() {
  return {
    endpoint: 'http://127.0.0.1:8000',
    apiToken: '',
    pollInterval: 300,
    rooms: [{
      platform: '自动识别',
      name: '测试主播',
      url: 'https://live.douyin.com/123456/',
      enabled: true,
      channels: 'test:channel',
    }],
    notifyOnStart: true,
    notifyOnEnd: true,
    notifyOnFirstLive: false,
    requestTimeout: 15,
    offlineConfirmations: 1,
    liveReminderInterval: 60,
    notificationStyle: '纯文字',
  }
}

test('插件重启后保留本场直播的起始时间', async () => {
  const database = createDatabase()
  const messages = []
  const startedAt = new Date(Date.now() - (3 * 60 + 5) * 60 * 1000).toISOString()
  const liveStatus = {
    id: 'backend-room-id',
    url: 'https://live.douyin.com/123456',
    platform: '抖音直播',
    is_live: true,
    display_name: '测试主播',
    detected_started_at: startedAt,
  }

  const firstContext = createContext(database, liveStatus, messages)
  plugin.apply(firstContext, createConfig())
  await firstContext.start()

  assert.equal(database.rows.size, 1)
  assert.equal([...database.rows.values()][0].isLive, true)

  const offlineStatus = {
    ...liveStatus,
    is_live: false,
    detected_started_at: '',
    live_duration: '',
  }
  const restartedContext = createContext(database, offlineStatus, messages)
  plugin.apply(restartedContext, createConfig())
  await restartedContext.start()

  assert.equal(messages.length, 1)
  assert.match(messages[0].content, /总直播时长：3小时[45]分钟/)
  const saved = [...database.rows.values()][0]
  assert.equal(saved.isLive, false)
  assert.equal(saved.liveStartedAt, '')
})

test('下播卡片不显示右上角状态角标', () => {
  const html = plugin.buildLiveCardHtml({
    id: 'backend-room-id',
    url: 'https://live.douyin.com/123456',
    platform: '抖音直播',
    is_live: false,
    display_name: '测试主播',
  }, false)

  assert.doesNotMatch(html, /class="badge"/)
  assert.match(html, /直播已结束/)
  assert.match(html, /直播结束/)
})

test('数据库晚于插件加载时仍会注册状态表', async () => {
  const database = createDatabase()
  const messages = []
  const status = {
    id: 'backend-room-id',
    url: 'https://live.douyin.com/123456',
    platform: '抖音直播',
    is_live: true,
    display_name: '测试主播',
    detected_started_at: new Date().toISOString(),
  }
  const context = createContext(undefined, status, messages)
  const registeredTables = []
  context.model.extend = (table) => {
    registeredTables.push(table)
  }

  plugin.apply(context, createConfig())
  assert.deepEqual(registeredTables, ['liveMonitorState', 'liveMonitorSession'])

  context.database = database
  await context.start()
  assert.equal(database.rows.size, 1)
})
