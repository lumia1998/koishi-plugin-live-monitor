const assert = require('node:assert/strict')
const { mkdtemp, readFile, rm } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const test = require('node:test')

const { AvatarCache } = require('../lib/avatar-cache.js')

test('主播头像按直播间持久缓存并仅在 URL 变化时替换', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'live-monitor-avatar-'))
  try {
    let fetchCount = 0
    const fetcher = async (url) => {
      fetchCount += 1
      return `data:image/png;base64,${Buffer.from(url).toString('base64')}`
    }

    const firstCache = new AvatarCache(directory)
    const first = await firstCache.get('room-1', 'https://example.com/avatar-1.png', fetcher)
    const repeated = await firstCache.get('room-1', 'https://example.com/avatar-1.png', fetcher)
    assert.equal(repeated, first)
    assert.equal(fetchCount, 1)

    const restartedCache = new AvatarCache(directory)
    const restored = await restartedCache.get('room-1', 'https://example.com/avatar-1.png', fetcher)
    assert.equal(restored, first)
    assert.equal(fetchCount, 1)

    const replaced = await restartedCache.get('room-1', 'https://example.com/avatar-2.png', fetcher)
    assert.notEqual(replaced, first)
    assert.equal(fetchCount, 2)

    const stored = JSON.parse(await readFile(join(directory, 'room-1.json'), 'utf8'))
    assert.equal(stored.sourceUrl, 'https://example.com/avatar-2.png')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
