export type StatisticsPeriod = 'day' | 'week' | 'month';
export interface LiveMonitorSessionRecord {
    id: string;
    roomId: string;
    roomUrl: string;
    platform: string;
    displayName: string;
    avatarUrl: string;
    coverUrl: string;
    title: string;
    startedAt: string;
    endedAt: string;
    durationSeconds: number;
    peakViewerCount: number;
    finalLikeCount: number;
    completed: boolean;
}
export interface DayBucket {
    key: string;
    date: Date;
    durationSeconds: number;
    sessionStarts: number;
}
export interface StatisticsSummary {
    rangeStart: Date;
    rangeEnd: Date;
    totalDurationSeconds: number;
    sessionCount: number;
    activeDays: number;
    averageDurationSeconds: number;
    longestDurationSeconds: number;
    days: DayBucket[];
}
export interface StatisticsCardInput {
    displayName: string;
    platform: string;
    avatarDataUrl?: string;
    periodLabel: string;
    summary: StatisticsSummary;
}
export declare function dateKey(value: Date): string;
export declare function formatStatisticsDuration(seconds: number): string;
export declare function getStatisticsRange(period: StatisticsPeriod, now?: Date): {
    start: Date;
    end: Date;
};
export declare function summarizeSessions(sessions: LiveMonitorSessionRecord[], rangeStart: Date, rangeEnd: Date, now?: Date): StatisticsSummary;
export declare function buildCalendarStatisticsHtml(input: StatisticsCardInput, year: number, month: number): string;
export declare function getAdaptiveTimeAxis(maxSeconds: number): {
    stepSeconds: number;
    maxSeconds: number;
    ticks: number[];
};
export declare function buildPeriodStatisticsHtml(input: StatisticsCardInput): string;
export declare function buildOverviewStatisticsHtml(input: StatisticsCardInput, daySummary: StatisticsSummary, weekSummary: StatisticsSummary, monthSummary: StatisticsSummary): string;
