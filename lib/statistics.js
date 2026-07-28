"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateKey = dateKey;
exports.formatStatisticsDuration = formatStatisticsDuration;
exports.getStatisticsRange = getStatisticsRange;
exports.summarizeSessions = summarizeSessions;
exports.buildCalendarStatisticsHtml = buildCalendarStatisticsHtml;
exports.getAdaptiveTimeAxis = getAdaptiveTimeAxis;
exports.buildPeriodStatisticsHtml = buildPeriodStatisticsHtml;
exports.buildOverviewStatisticsHtml = buildOverviewStatisticsHtml;
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function startOfDay(value) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
function addDays(value, amount) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate() + amount);
}
function dateKey(value) {
    const pad = (input) => String(input).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}
function formatStatisticsDuration(seconds) {
    const minutes = Math.max(0, Math.floor(seconds / 60));
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const restMinutes = minutes % 60;
    if (days)
        return `${days}天 ${hours}小时`;
    if (hours)
        return `${hours}小时 ${restMinutes}分`;
    return `${restMinutes}分钟`;
}
function getStatisticsRange(period, now = new Date()) {
    if (period === 'day') {
        const start = startOfDay(now);
        return { start, end: addDays(start, 1) };
    }
    if (period === 'week') {
        const start = startOfDay(now);
        const mondayOffset = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - mondayOffset);
        return { start, end: addDays(start, 7) };
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
}
function parseSessionTimes(session, now) {
    const startedAt = new Date(session.startedAt);
    const endedAt = session.completed && session.endedAt ? new Date(session.endedAt) : now;
    if (!Number.isFinite(startedAt.getTime()) || !Number.isFinite(endedAt.getTime()))
        return;
    if (endedAt <= startedAt)
        return;
    return { startedAt, endedAt };
}
function summarizeSessions(sessions, rangeStart, rangeEnd, now = new Date()) {
    const days = [];
    for (let day = startOfDay(rangeStart); day < rangeEnd; day = addDays(day, 1)) {
        days.push({ key: dateKey(day), date: day, durationSeconds: 0, sessionStarts: 0 });
    }
    const buckets = new Map(days.map(day => [day.key, day]));
    let totalDurationSeconds = 0;
    let sessionCount = 0;
    let longestDurationSeconds = 0;
    for (const session of sessions) {
        const times = parseSessionTimes(session, now);
        if (!times)
            continue;
        const overlapStart = new Date(Math.max(times.startedAt.getTime(), rangeStart.getTime()));
        const overlapEnd = new Date(Math.min(times.endedAt.getTime(), rangeEnd.getTime()));
        if (overlapEnd <= overlapStart)
            continue;
        const overlapSeconds = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 1000);
        totalDurationSeconds += overlapSeconds;
        longestDurationSeconds = Math.max(longestDurationSeconds, overlapSeconds);
        sessionCount += 1;
        if (times.startedAt >= rangeStart && times.startedAt < rangeEnd) {
            const startBucket = buckets.get(dateKey(times.startedAt));
            if (startBucket)
                startBucket.sessionStarts += 1;
        }
        for (let cursor = startOfDay(overlapStart); cursor < overlapEnd; cursor = addDays(cursor, 1)) {
            const bucket = buckets.get(dateKey(cursor));
            if (!bucket)
                continue;
            const dayEnd = addDays(cursor, 1);
            const segmentStart = Math.max(overlapStart.getTime(), cursor.getTime());
            const segmentEnd = Math.min(overlapEnd.getTime(), dayEnd.getTime());
            bucket.durationSeconds += Math.max(0, Math.floor((segmentEnd - segmentStart) / 1000));
        }
    }
    const activeDays = days.filter(day => day.durationSeconds > 0).length;
    return {
        rangeStart,
        rangeEnd,
        totalDurationSeconds,
        sessionCount,
        activeDays,
        averageDurationSeconds: sessionCount ? Math.floor(totalDurationSeconds / sessionCount) : 0,
        longestDurationSeconds,
        days,
    };
}
function backgroundLayer(avatarDataUrl) {
    if (!avatarDataUrl)
        return '<div class="portrait-fallback"></div>';
    return `<img class="portrait" src="${escapeHtml(avatarDataUrl)}" alt="主播头像背景">`;
}
function sharedStyles() {
    return `
    * { box-sizing: border-box; }
    html, body { margin: 0; background: transparent; }
    body { font-family: "Noto Sans CJK SC", "Microsoft YaHei", sans-serif; color: #172033; letter-spacing: 0; }
    .poster { position: relative; overflow: hidden; width: 800px; background: #f7f8fc; }
    .portrait, .portrait-fallback { position: absolute; inset: 0; width: 100%; height: 100%; }
    .portrait { object-fit: cover; transform: scale(1.08); filter: saturate(.65) brightness(1.12) blur(12px); opacity: .18; }
    .portrait-fallback { background: #f4f6fb; }
    .shade { position: absolute; inset: 0; background: rgba(250,251,255,.90); }
    .content { position: relative; z-index: 1; padding: 34px; }
    .profile { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .profile-avatar { width: 62px; height: 62px; flex: none; overflow: hidden; border: 3px solid rgba(255,255,255,.92); border-radius: 18px; background: #e9edf5; box-shadow: 0 5px 16px rgba(41,51,74,.12); }
    .profile-avatar img { width: 100%; height: 100%; display: block; object-fit: cover; }
    .eyebrow { color: #7c8498; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .name { margin-top: 3px; max-width: 580px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 28px; font-weight: 800; }
    .platform { margin-top: 3px; color: #747d90; font-size: 13px; }
    .rule { height: 1px; margin: 22px 0; background: #dfe3ec; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #dfe3ec; border-bottom: 1px solid #dfe3ec; }
    .metric { min-width: 0; padding: 15px 12px; border-right: 1px solid #dfe3ec; }
    .metric:first-child { padding-left: 0; }
    .metric:last-child { border-right: 0; }
    .metric-value { overflow: hidden; color: #4326a8; font-size: 21px; font-weight: 800; white-space: nowrap; }
    .metric-label { margin-top: 3px; color: #7d8597; font-size: 11px; }
  `;
}
function profileHeader(input, eyebrow) {
    const avatar = input.avatarDataUrl
        ? `<img src="${escapeHtml(input.avatarDataUrl)}" alt="主播头像">`
        : '';
    return `<div class="profile"><div class="profile-avatar">${avatar}</div><div style="min-width:0"><div class="eyebrow">${escapeHtml(eyebrow)}</div><div class="name">${escapeHtml(input.displayName)}</div><div class="platform">${escapeHtml(input.platform)}</div></div></div>`;
}
function buildCalendarStatisticsHtml(input, year, month) {
    const { summary } = input;
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const buckets = new Map(summary.days.map(day => [day.date.getDate(), day]));
    const maxDuration = Math.max(1, ...summary.days.map(day => day.durationSeconds));
    const cells = [];
    for (let i = 0; i < firstDay.getDay(); i++)
        cells.push('<div class="day empty"></div>');
    for (let day = 1; day <= daysInMonth; day++) {
        const bucket = buckets.get(day);
        const duration = bucket?.durationSeconds || 0;
        const live = duration > 0;
        const durationText = live ? formatStatisticsDuration(duration) : '';
        const heatClass = duration < 2 * 3600 ? 'heat-1'
            : duration < 4 * 3600 ? 'heat-2'
                : duration < 6 * 3600 ? 'heat-3' : 'heat-4';
        cells.push(`
      <div class="day${live ? ` live ${heatClass}` : ''}">
        <span class="day-number">${day}</span>
        ${live ? `<span class="day-duration">${escapeHtml(durationText)}</span>` : ''}
      </div>
    `);
    }
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    ${sharedStyles()}
    .poster { min-height: 850px; }
    .calendar-title { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .month { flex: none; color: #1d2433; font-size: 24px; line-height: 1; font-weight: 800; text-align: right; }
    .month small { display: block; margin-top: 7px; color: #81899a; font-size: 11px; font-weight: 600; }
    .legend { display: flex; align-items: center; justify-content: flex-end; gap: 13px; margin: 18px 0; color: #70798d; font-size: 10px; }
    .legend-item { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
    .swatch { width: 11px; height: 11px; border-radius: 3px; background: #edf0f6; }
    .swatch.heat-1 { background:#eeeaff; } .swatch.heat-2 { background:#d8cbff; } .swatch.heat-3 { background:#a98ce8; } .swatch.heat-4 { background:#5b36bd; }
    .weekdays, .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
    .weekdays { margin-bottom: 8px; color: #6c7485; font-size: 12px; font-weight: 700; text-align: center; }
    .day { position: relative; height: 73px; overflow: hidden; border: 1px solid #e5e8ef; border-radius: 7px; background: rgba(255,255,255,.62); }
    .day.empty { visibility: hidden; }
    .day.live { border-color: transparent; }
    .day.heat-1 { background:#eeeaff; } .day.heat-2 { background:#d8cbff; } .day.heat-3 { background:#a98ce8; color:#22133f; } .day.heat-4 { background:#5b36bd; color:#fff; }
    .day-number { position: absolute; top: 9px; left: 10px; font-size: 14px; font-weight: 800; }
    .day-duration { position: absolute; right: 7px; bottom: 8px; left: 7px; overflow: hidden; font-size: 9px; font-weight: 700; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
    .calendar-foot { display:flex; justify-content:space-between; margin-top:12px; color:#778093; font-size:11px; }
  </style></head><body><div class="poster">${backgroundLayer(input.avatarDataUrl)}<div class="shade"></div><div class="content">
    <div class="calendar-title">${profileHeader(input, '直播打卡日历')}<div class="month">${year}年${month}月<small>LIVE ATTENDANCE</small></div></div>
    <div class="legend"><span class="legend-item"><i class="swatch"></i>无直播</span><span class="legend-item"><i class="swatch heat-1"></i>&lt; 2小时</span><span class="legend-item"><i class="swatch heat-2"></i>2-4小时</span><span class="legend-item"><i class="swatch heat-3"></i>4-6小时</span><span class="legend-item"><i class="swatch heat-4"></i>≥ 6小时</span></div>
    <div class="weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
    <div class="calendar-grid">${cells.join('')}</div>
    <div class="calendar-foot"><span>有直播的日期会按当日时长点亮</span><span>${summary.activeDays} / ${daysInMonth} 天</span></div>
    <div class="rule"></div>
    <div class="summary">
      <div class="metric"><div class="metric-value">${escapeHtml(formatStatisticsDuration(summary.totalDurationSeconds))}</div><div class="metric-label">本月直播时长</div></div>
      <div class="metric"><div class="metric-value">${summary.sessionCount}</div><div class="metric-label">开播场次</div></div>
      <div class="metric"><div class="metric-value">${escapeHtml(formatStatisticsDuration(summary.averageDurationSeconds))}</div><div class="metric-label">平均时长</div></div>
      <div class="metric"><div class="metric-value">${escapeHtml(formatStatisticsDuration(summary.longestDurationSeconds))}</div><div class="metric-label">最长单场</div></div>
    </div>
  </div></div></body></html>`;
}
function getAdaptiveTimeAxis(maxSeconds) {
    const steps = [15 * 60, 30 * 60, 60 * 60, 2 * 3600, 3 * 3600, 4 * 3600, 6 * 3600, 8 * 3600, 12 * 3600, 24 * 3600];
    const minimumStep = Math.max(1, maxSeconds) / 4;
    const stepSeconds = steps.find(step => step >= minimumStep) || Math.ceil(minimumStep / 86400) * 86400;
    return { stepSeconds, maxSeconds: stepSeconds * 4, ticks: [0, 1, 2, 3, 4].map(index => index * stepSeconds) };
}
function formatAxisDuration(seconds) {
    if (seconds === 0)
        return '0';
    if (seconds < 3600)
        return `${Math.round(seconds / 60)}m`;
    const hours = seconds / 3600;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}
function buildLineChart(summary) {
    const width = 710;
    const height = 260;
    const left = 48;
    const right = 12;
    const top = 16;
    const bottom = 34;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const axis = getAdaptiveTimeAxis(Math.max(0, ...summary.days.map(day => day.durationSeconds)));
    const points = summary.days.map((day, index) => {
        const x = summary.days.length <= 1 ? left + plotWidth / 2 : left + index / (summary.days.length - 1) * plotWidth;
        const y = top + (1 - day.durationSeconds / axis.maxSeconds) * plotHeight;
        return { x, y, day };
    });
    const horizontalLines = axis.ticks.map((tick, index) => {
        const y = top + (1 - tick / axis.maxSeconds) * plotHeight;
        return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="grid-line"/><text x="${left - 8}" y="${y + 4}" class="axis-label" text-anchor="end">${formatAxisDuration(tick)}</text>`;
    }).join('');
    const labelInterval = Math.max(1, Math.ceil(summary.days.length / 5));
    const xLabels = points.map((point, index) => {
        if (index % labelInterval !== 0 && index !== points.length - 1)
            return '';
        return `<text x="${point.x}" y="${height - 6}" class="axis-label" text-anchor="middle">${String(point.day.date.getMonth() + 1).padStart(2, '0')}-${String(point.day.date.getDate()).padStart(2, '0')}</text>`;
    }).join('');
    const polyline = points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    const dots = points.filter(point => point.day.durationSeconds > 0).map(point => `<circle cx="${point.x}" cy="${point.y}" r="3" class="line-dot"/>`).join('');
    return `<svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="直播时长折线图">${horizontalLines}<polyline points="${polyline}" class="trend-line"/>${dots}${xLabels}</svg>`;
}
function buildPeriodStatisticsHtml(input) {
    const { summary } = input;
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    ${sharedStyles()}
    .poster { min-height: 690px; }
    .period { color: #7457c8; font-size: 13px; font-weight: 800; }
    .total { margin-top: 24px; color:#3c25a3; font-size: 58px; line-height: 1; font-weight: 800; }
    .total-label { margin-top: 7px; color: #7b8496; font-size: 12px; }
    .chart-title { margin-top:24px; color:#293146; font-size:14px; font-weight:800; }
    .line-chart { display:block; width:100%; height:260px; margin-top:10px; overflow:visible; }
    .grid-line { stroke:#dfe3ec; stroke-width:1; }
    .axis-label { fill:#7d8596; font-size:10px; }
    .trend-line { fill:none; stroke:#6742d7; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
    .line-dot { fill:#6742d7; stroke:#fff; stroke-width:2; }
  </style></head><body><div class="poster">${backgroundLayer(input.avatarDataUrl)}<div class="shade"></div><div class="content">
    ${profileHeader(input, '直播数据统计')}
    <div class="rule"></div><div class="period">${escapeHtml(input.periodLabel)}</div>
    <div class="total">${escapeHtml(formatStatisticsDuration(summary.totalDurationSeconds))}</div><div class="total-label">累计直播时长</div>
    <div class="chart-title">直播时长趋势</div>${buildLineChart(summary)}
    <div class="summary">
      <div class="metric"><div class="metric-value">${summary.sessionCount}</div><div class="metric-label">开播场次</div></div>
      <div class="metric"><div class="metric-value">${summary.activeDays}</div><div class="metric-label">直播天数</div></div>
      <div class="metric"><div class="metric-value">${escapeHtml(formatStatisticsDuration(summary.averageDurationSeconds))}</div><div class="metric-label">平均时长</div></div>
      <div class="metric"><div class="metric-value">${escapeHtml(formatStatisticsDuration(summary.longestDurationSeconds))}</div><div class="metric-label">最长单场</div></div>
    </div>
  </div></div></body></html>`;
}
function buildOverviewStatisticsHtml(input, daySummary, weekSummary, monthSummary) {
    const periodMetrics = [
        { label: '今日', summary: daySummary },
        { label: '本周', summary: weekSummary },
        { label: '本月', summary: monthSummary },
    ].map(item => `<div class="period-metric"><div class="period-name">${item.label}</div><div class="period-value">${escapeHtml(formatStatisticsDuration(item.summary.totalDurationSeconds))}</div><div class="period-count">开播 ${item.summary.sessionCount} 次</div></div>`).join('');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    ${sharedStyles()}
    .poster { min-height: 720px; }
    .period-grid { display:grid; grid-template-columns:repeat(3,1fr); border:1px solid #dfe3ec; border-radius:7px; background:rgba(255,255,255,.58); }
    .period-metric { min-width:0; padding:17px 18px; border-right:1px solid #dfe3ec; }
    .period-metric:last-child { border-right:0; }
    .period-name { color:#717a8e; font-size:12px; font-weight:700; }
    .period-value { margin-top:8px; overflow:hidden; color:#4326a8; font-size:25px; font-weight:800; white-space:nowrap; }
    .period-count { margin-top:5px; color:#15966a; font-size:11px; font-weight:700; }
    .chart-title { margin-top:26px; color:#293146; font-size:14px; font-weight:800; }
    .line-chart { display:block; width:100%; height:260px; margin-top:10px; overflow:visible; }
    .grid-line { stroke:#dfe3ec; stroke-width:1; }
    .axis-label { fill:#7d8596; font-size:10px; }
    .trend-line { fill:none; stroke:#6742d7; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
    .line-dot { fill:#6742d7; stroke:#fff; stroke-width:2; }
  </style></head><body><div class="poster">${backgroundLayer(input.avatarDataUrl)}<div class="shade"></div><div class="content">
    ${profileHeader(input, '直播数据统计')}<div class="rule"></div>
    <div class="period-grid">${periodMetrics}</div>
    <div class="chart-title">本月逐日直播时长</div>${buildLineChart(monthSummary)}
    <div class="summary">
      <div class="metric"><div class="metric-value">${monthSummary.activeDays}</div><div class="metric-label">本月直播天数</div></div>
      <div class="metric"><div class="metric-value">${monthSummary.sessionCount}</div><div class="metric-label">本月开播场次</div></div>
      <div class="metric"><div class="metric-value">${escapeHtml(formatStatisticsDuration(monthSummary.averageDurationSeconds))}</div><div class="metric-label">本月平均时长</div></div>
      <div class="metric"><div class="metric-value">${escapeHtml(formatStatisticsDuration(monthSummary.longestDurationSeconds))}</div><div class="metric-label">本月最长单场</div></div>
    </div>
  </div></div></body></html>`;
}
