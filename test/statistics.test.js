const assert = require('node:assert/strict')
const test = require('node:test')

const statistics = require('../lib/statistics.js')

function session(startedAt, endedAt) {
  return {
    id: 'session-1',
    roomId: 'room-1',
    roomUrl: 'https://live.douyin.com/123456',
    platform: '抖音直播',
    displayName: '测试主播',
    avatarUrl: 'https://example.com/avatar.png',
    coverUrl: '',
    title: '测试直播',
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSeconds: Math.floor((endedAt - startedAt) / 1000),
    peakViewerCount: 100,
    finalLikeCount: 20,
    completed: true,
  }
}

test('跨午夜直播会点亮两天并按日期拆分时长', () => {
  const startedAt = new Date(2026, 6, 27, 23, 0, 0)
  const endedAt = new Date(2026, 6, 28, 1, 0, 0)
  const summary = statistics.summarizeSessions(
    [session(startedAt, endedAt)],
    new Date(2026, 6, 1),
    new Date(2026, 7, 1),
    endedAt,
  )

  assert.equal(summary.totalDurationSeconds, 7200)
  assert.equal(summary.sessionCount, 1)
  assert.equal(summary.activeDays, 2)
  assert.equal(summary.days.find(day => day.date.getDate() === 27).durationSeconds, 3600)
  assert.equal(summary.days.find(day => day.date.getDate() === 28).durationSeconds, 3600)
})

test('直播打卡日历使用主播头像全幅裁剪背景', () => {
  const startedAt = new Date(2026, 6, 27, 23, 0, 0)
  const endedAt = new Date(2026, 6, 28, 1, 0, 0)
  const summary = statistics.summarizeSessions(
    [session(startedAt, endedAt)],
    new Date(2026, 6, 1),
    new Date(2026, 7, 1),
    endedAt,
  )
  const html = statistics.buildCalendarStatisticsHtml({
    displayName: '测试主播',
    platform: '抖音直播',
    avatarDataUrl: 'data:image/png;base64,avatar',
    periodLabel: '2026年7月',
    summary,
  }, 2026, 7)

  assert.match(html, /object-fit: cover/)
  assert.match(html, /data:image\/png;base64,avatar/)
  assert.equal((html.match(/class="day live heat-/g) || []).length, 2)
  assert.match(html, /LIVE ATTENDANCE/)
})

test('折线图纵轴按最长单日时长自适应四等分', () => {
  assert.deepEqual(statistics.getAdaptiveTimeAxis(6.3 * 3600), {
    stepSeconds: 2 * 3600,
    maxSeconds: 8 * 3600,
    ticks: [0, 2 * 3600, 4 * 3600, 6 * 3600, 8 * 3600],
  })
  assert.deepEqual(statistics.getAdaptiveTimeAxis(80 * 60), {
    stepSeconds: 30 * 60,
    maxSeconds: 2 * 3600,
    ticks: [0, 30 * 60, 60 * 60, 90 * 60, 120 * 60],
  })
})
