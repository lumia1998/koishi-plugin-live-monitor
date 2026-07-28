const fs = require('node:fs')
const path = require('node:path')

const statistics = require('../lib/statistics.js')

const outputDirectory = process.argv[2]
const portraitPath = process.argv[3]
if (!outputDirectory) throw new Error('Usage: node scripts/generate-statistics-previews.js <output-directory> [portrait-image]')

const avatarDataUrl = portraitPath
  ? `data:image/${path.extname(portraitPath).slice(1) || 'png'};base64,${fs.readFileSync(portraitPath).toString('base64')}`
  : undefined

function session(day, startHour, durationMinutes) {
  const startedAt = new Date(2026, 6, day, startHour, 0, 0)
  const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000)
  return {
    id: `session-${day}-${startHour}`,
    roomId: 'room-1',
    roomUrl: 'https://live.douyin.com/123456',
    platform: '抖音直播',
    displayName: '水水 · 夏日直播手账',
    avatarUrl: '',
    coverUrl: '',
    title: '今晚也要好好直播',
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationSeconds: durationMinutes * 60,
    peakViewerCount: 320,
    finalLikeCount: 880,
    completed: true,
  }
}

const sessions = [
  session(1, 20, 95), session(3, 21, 180), session(4, 19, 70), session(7, 22, 210),
  session(8, 23, 150), session(12, 18, 260), session(14, 21, 80), session(18, 20, 320),
  session(20, 22, 120), session(23, 19, 240), session(27, 23, 150), session(30, 20, 190),
]
const rangeStart = new Date(2026, 6, 1)
const rangeEnd = new Date(2026, 7, 1)
const summary = statistics.summarizeSessions(sessions, rangeStart, rangeEnd, new Date(2026, 6, 31, 12))
const input = {
  displayName: '水水 · 夏日直播手账',
  platform: '抖音直播',
  avatarDataUrl,
  periodLabel: '2026年7月',
  summary,
}

fs.mkdirSync(outputDirectory, { recursive: true })
fs.writeFileSync(path.join(outputDirectory, 'calendar.html'), statistics.buildCalendarStatisticsHtml(input, 2026, 7))
fs.writeFileSync(path.join(outputDirectory, 'month.html'), statistics.buildPeriodStatisticsHtml(input))
const previewNow = new Date(2026, 6, 31, 12)
const dayRange = statistics.getStatisticsRange('day', previewNow)
const weekRange = statistics.getStatisticsRange('week', previewNow)
const daySummary = statistics.summarizeSessions(sessions, dayRange.start, dayRange.end, previewNow)
const weekSummary = statistics.summarizeSessions(sessions, weekRange.start, weekRange.end, previewNow)
fs.writeFileSync(path.join(outputDirectory, 'overview.html'), statistics.buildOverviewStatisticsHtml(input, daySummary, weekSummary, summary))
