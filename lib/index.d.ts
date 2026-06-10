import { Context, Schema } from 'koishi';
export declare const name = "live-monitor";
export declare const inject: {
    optional: string[];
};
declare const platformOptions: readonly ["自动识别", "抖音直播", "TwitchTV", "B站直播", "虎牙直播", "斗鱼直播", "快手直播", "TikTok直播", "Youtube", "小红书直播", "Acfun", "YY直播", "微博直播", "知乎直播", "CHZZK", "TwitCasting", "SOOP", "ShowRoom", "LiveMe", "shopee", "自定义直播源"];
type PlatformValue = typeof platformOptions[number];
type NotificationStyle = '图片卡片' | '纯文字';
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
    notifyChannels: string[];
    rooms: RoomConfig[];
    notifyOnStart: boolean;
    notifyOnEnd: boolean;
    notifyOnFirstLive: boolean;
    requestTimeout: number;
    liveReminderInterval: number;
    notificationStyle: NotificationStyle;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
export {};
