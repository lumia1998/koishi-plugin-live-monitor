import { Context, Schema } from 'koishi';
import { LiveMonitorSessionRecord } from './statistics';
export declare const name = "live-monitor";
export declare const inject: {
    optional: string[];
};
declare const platformOptions: readonly ["自动识别", "抖音直播", "TwitchTV", "B站直播", "虎牙直播", "斗鱼直播", "快手直播", "TikTok直播", "Youtube", "小红书直播", "Acfun", "YY直播", "微博直播", "知乎直播", "CHZZK", "TwitCasting", "SOOP", "ShowRoom", "LiveMe", "shopee", "自定义直播源"];
type PlatformValue = typeof platformOptions[number];
type NotificationStyle = '图片卡片' | '纯文字';
interface LiveMonitorState {
    id: string;
    isLive: boolean;
    liveStartedAt: string;
    lastNotifiedAt: string;
    sessionId: string;
}
declare module 'koishi' {
    interface Tables {
        liveMonitorState: LiveMonitorState;
        liveMonitorSession: LiveMonitorSessionRecord;
    }
}
export interface RoomConfig {
    platform?: PlatformValue;
    name?: string;
    url: string;
    enabled?: boolean;
    channels?: string;
    mentionAllOnStart?: boolean;
}
export interface Config {
    endpoint: string;
    apiToken: string;
    pollInterval: number;
    rooms: RoomConfig[];
    notifyOnStart: boolean;
    notifyOnEnd: boolean;
    notifyOnFirstLive: boolean;
    requestTimeout: number;
    offlineConfirmations: number;
    liveReminderInterval: number;
    notificationStyle: NotificationStyle;
}
export declare const Config: Schema<Config>;
interface BackendStatus {
    id: string;
    url: string;
    platform: string;
    is_live: boolean;
    anchor_name?: string;
    configured_name?: string;
    display_name: string;
    title?: string;
    cover_url?: string;
    avatar_url?: string;
    viewer_count?: number | string | null;
    popularity?: number | string | null;
    like_count?: number | string | null;
    area_name?: string;
    started_at?: string;
    detected_started_at?: string;
    live_duration_seconds?: number | null;
    live_duration?: string;
    category?: string;
    checked_at?: string;
    error?: string;
    extra?: Record<string, unknown>;
}
interface LiveCardImages {
    cover?: string;
    avatar?: string;
}
export declare function buildLiveCardHtml(status: BackendStatus, started: boolean, images?: LiveCardImages): string;
export declare function apply(ctx: Context, config: Config): void;
export {};
