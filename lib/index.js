"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.inject = exports.name = void 0;
exports.apply = apply;
const koishi_1 = require("koishi");
exports.name = 'live-monitor';
exports.inject = { optional: ['puppeteer', 'database'] };
const platformOptions = [
    '自动识别',
    '抖音直播',
    'TwitchTV',
    'B站直播',
    '虎牙直播',
    '斗鱼直播',
    '快手直播',
    'TikTok直播',
    'Youtube',
    '小红书直播',
    'Acfun',
    'YY直播',
    '微博直播',
    '知乎直播',
    'CHZZK',
    'TwitCasting',
    'SOOP',
    'ShowRoom',
    'LiveMe',
    'shopee',
    '自定义直播源',
];
const platformSchema = koishi_1.Schema.union([...platformOptions]).default('自动识别');
exports.Config = koishi_1.Schema.object({
    endpoint: koishi_1.Schema.string().default('http://127.0.0.1:8000').description('Live Monitor 后端 API 地址'),
    pollInterval: koishi_1.Schema.number().min(30).default(300).description('轮询间隔，单位秒'),
    requestTimeout: koishi_1.Schema.number().min(3).default(15).description('请求后端超时时间，单位秒'),
    notifyChannels: koishi_1.Schema.array(String).role('table').default([]).description('默认通知频道 ID。留空时不会自动推送，但直播间仍可通过命令查看。'),
    notifyOnStart: koishi_1.Schema.boolean().default(true).description('检测到开播时推送'),
    notifyOnEnd: koishi_1.Schema.boolean().default(false).description('检测到关播时推送'),
    notifyOnFirstLive: koishi_1.Schema.boolean().default(false).description('插件启动后首次检测到已开播也推送'),
    liveReminderInterval: koishi_1.Schema.number().min(0).default(30).description('正在直播中的主播重复推送提醒间隔（分钟），默认每 30 分钟提醒一次；设为 0 表示不重复推送（仅开/关播时推送）。'),
    notificationStyle: koishi_1.Schema.union(['图片卡片', '纯文字']).default('图片卡片').description('通知样式。图片卡片会在同一条消息中发送卡片图片和直播地址；纯文字只发送文本。'),
    rooms: koishi_1.Schema.array(koishi_1.Schema.object({
        platform: platformSchema.description('平台。选自动识别时，后端会根据直播地址判断。'),
        name: koishi_1.Schema.string().description('主播展示名，可留空使用后端解析结果'),
        url: koishi_1.Schema.string().required().description('直播间地址'),
        enabled: koishi_1.Schema.boolean().default(true).description('是否启用监控'),
        channels: koishi_1.Schema.string().default('').description('绑定频道 ID。多个频道用逗号分隔；留空使用默认通知频道，默认也为空则不自动推送但命令可见。'),
        mentionAllOnStart: koishi_1.Schema.boolean().default(false).description('开播推送时 @全体成员。只对该行绑定的频道生效；重复提醒不会 @全体。'),
    })).role('table').default([]).description('关注主播列表'),
});
const fallbackIcons = {
    bilibili: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CgkJPHBhdGggZD0ibTEyLjU5NCAyMy4yNThsLS4wMTIuMDAybC0uMDcxLjAzNWwtLjAyLjAwNGwtLjAxNC0uMDA0bC0uMDcxLS4wMzZxLS4wMTYtLjAwNC0uMDI0LjAwNmwtLjAwNC4wMWwtLjAxNy40MjhsLjAwNS4wMmwuMDEuMDEzbC4xMDQuMDc0bC4wMTUuMDA0bC4wMTItLjAwNGwuMTA0LS4wNzRsLjAxMi0uMDE2bC4wMDQtLjAxN2wtLjAxNy0uNDI3cS0uMDA0LS4wMTYtLjAxNi0uMDE4bS4yNjQtLjExM2wtLjAxNC4wMDJsLS4xODQuMDkzbC0uMDEuMDFsLS4wMDMuMDExbC4wMTguNDNsLjAwNS4wMTJsLjAwOC4wMDhsLjIwMS4wOTJxLjAxOS4wMDUuMDI5LS4wMDhsLjAwNC0uMDE0bC0uMDM0LS42MTRxLS4wMDUtLjAxOS0uMDItLjAyMm0tLjcxNS4wMDJhLjAyLjAyIDAgMCAwLS4wMjcuMDA2bC0uMDA2LjAxNGwtLjAzNC42MTRxLjAwMS4wMTguMDE3LjAyNGwuMDE1LS4wMDJsLjIwMS0uMDkzbC4wMS0uMDA4bC4wMDMtLjAxMWwuMDE4LS40M2wtLjAwMy0uMDEybC0uMDEtLjAxeiIgLz4KCQk8cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik02LjQ0NSAzLjE2OGExIDEgMCAwIDEgMS4zODcuMjc3TDkuNTM1IDZoNC45M2wxLjcwMy0yLjU1NWExIDEgMCAwIDEgMS42NjQgMS4xMUwxNi44NyA2SDE4YTQgNCAwIDAgMSA0IDR2N2E0IDQgMCAwIDEtNCA0SDZhNCA0IDAgMCAxLTQtNHYtN2E0IDQgMCAwIDEgNC00aDEuMTMxbC0uOTYzLTEuNDQ1YTEgMSAwIDAgMSAuMjc3LTEuMzg3TTguOTg2IDhINmEyIDIgMCAwIDAtMiAydjdhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0ydi03YTIgMiAwIDAgMC0yLTJIOS4wMTZ6TTkgMTFhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDEgMS0yIDB2LTJhMSAxIDAgMCAxIDEtMW02IDBhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDEgMS0yIDB2LTJhMSAxIDAgMCAxIDEtMSIgLz4KCTwvZz4KPC9zdmc+Cg==',
    douyin: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTE2LjYgNS44MnMuNTEuNSAwIDBBNC4yOCA0LjI4IDAgMCAxIDE1LjU0IDNoLTMuMDl2MTIuNGEyLjU5IDIuNTkgMCAwIDEtMi41OSAyLjVjLTEuNDIgMC0yLjYtMS4xNi0yLjYtMi42YzAtMS43MiAxLjY2LTMuMDEgMy4zNy0yLjQ4VjkuNjZjLTMuNDUtLjQ2LTYuNDcgMi4yMi02LjQ3IDUuNjRjMCAzLjMzIDIuNzYgNS43IDUuNjkgNS43YzMuMTQgMCA1LjY5LTIuNTUgNS42OS01LjdWOS4wMWE3LjM1IDcuMzUgMCAwIDAgNC4zIDEuMzhWNy4zcy0xLjg4LjA5LTMuMjQtMS40OCIgLz4KPC9zdmc+Cg==',
    huya: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgNDggNDgiPgoJPHBhdGggZD0iTTAgMGg0OHY0OEgweiIgZmlsbD0ibm9uZSIgLz4KCTxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPgoJCTxwYXRoIGQ9Ik0zNi40OTUgMTQuMTQzYzguNjgxIDkuMzggNi42ODggMTguMTU4IDIuMDMyIDIyLjIzNGMtMi44NDcgMi40OTItNy4xMSAzLjkxOS0xMS45MzUgNC4yNzhjLTkuMTEyLjY3Ny0xOC43Ny0xLjg2My0yMC43NzctMTEuMDIzYy0uODA2LTMuNjc4LS4zNjMtOC43NjQgNC4wNjgtMTMuNDljLjAwNy0zLjU4Ni45My01LjgwNiAyLjYzNi04LjQ3NGExNCAxNCAwIDAgMSA2LjYyOCAyLjIwM2MyLjMzOS0uNzM1IDQuMTE1LS44NjggNi4zNzItLjU4MmMxLjE4Ni0uOTE5IDEuODM3LTEuNTYyIDMuMTQzLTIuMDQ3YzQuMTkgMS43NzIgNS45OTQgMy45MzggNy44MzMgNi45IiAvPgoJCTxwYXRoIGQ9Ik0xOC44NTcgMzIuMzkxYzEuOTQzIDIuNDE3IDExLjgxNSAxLjU2IDE0LjA5Mi0xLjI1NCIgLz4KCQk8cGF0aCBkPSJNMzIuNzMgMzEuMzgyYy4yMjMgMS40MjctLjAwNSAyLjcyMi0uNTkyIDMuODUzYy0xLjA2My0uMzEtMi4yNTgtMS4wNjMtMi44MzctMi4xNG0tNi4zODEuNjc1Yy0uNDE4IDEuMDQ4LTEuMjE3IDEuODk0LTIuMzYyIDIuNTA0Yy0uODIzLTEuMDAzLTEuMzYxLTIuMjg3LTEuNDAyLTMuNTg0TTUuODU3IDI5LjgxNGMxLjQxNi0uODYxIDMuMjY2LTEuMzgyIDUuMzg4LTEuNTc1Yy0xLjU3MyAxLjY2LTIuOTQgMy40MjItMy44MyA1LjQyNG0yLjEyNSAyLjU3OGMxLjQyNC0xLjk4NSAzLjM0LTMuMzc0IDUuNjk5LTQuMDE3Yy0xLjIyNyAxLjk3NS0xLjY4NSA0LjQyNC0xLjU0NSA2LjY3M20yOC42MzktOS40NjFjLS43NTItMS4wNjYtMS43MDctMi4wNjQtMy4yMDMtMy4xOGMxLjE5NS0uMTcgMi4xNTUtLjA4NCAzLjM0OS4yMzNtLTMuNzQgOS42OTVjLS4zLTEuNzE2LTEuMDcyLTMuODY0LTIuNjE5LTUuNDhhOS41MyA5LjUzIDAgMCAxIDUuMDg5IDIuMTgyTTMwLjE3NCAyMC4yNzhjLjA4NiAxLjcxNy01LjYwMiA1LjQ1NC03LjExIDQuNjcxcy0xLjg1NC03LjY0OC0uNDMyLTguNTgzYzEuNDIyLS45MzQgNy40NTUgMi4xOTUgNy41NDIgMy45MTIiIC8+CgkJPHBhdGggZD0iTTI1LjcyNCAyOC45ODRjNy41Ni0uNjYgMTEuODE3LS44NyAxMi44MDQtNC45M2MxLjIyNy01LjA0Ni01LjU4Mi0xMi42OTctMTQuMzIxLTExLjkzNGMtNi4yNzcuNTQ3LTEyLjY1IDQuODIxLTEyLjUyIDExLjc2NWMuMTA5IDUuODQ1IDQuNDg1IDUuOTMzIDE0LjAzNyA1LjEiIC8+Cgk8L2c+Cjwvc3ZnPgo=',
    kuaishou: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTE4LjMxNSAxMi4yNjRjMi4zMyAwIDQuMjE4IDEuODggNC4yMTggNC4yVjE5LjhjMCAyLjMyLTEuODg4IDQuMi00LjIxOCA0LjJoLTYuMjAyYTQuMjIgNC4yMiAwIDAgMS00LjAyMy0yLjkzOGwtMy42NzYgMS44MzNhMi4wNCAyLjA0IDAgMCAxLTIuNzMxLS45MDNhMiAyIDAgMCAxLS4yMTYtLjkwN3YtNS45NGEyLjAzIDIuMDMgMCAwIDEgMi4wMzUtMi4wMjRhMi4wNCAyLjA0IDAgMCAxIC45MTkuMjE4bDMuNjczIDEuODVhNC4yMiA0LjIyIDAgMCAxIDQuMDItMi45MjV6bS0uMDYyIDIuMTYyaC02LjA3OGMtMS4xNTMgMC0yLjA5LjkyMS0yLjEwOCAyLjA2NXYzLjI0N2MwIDEuMTQ4LjkyNSAyLjA4MSAyLjA3MyAyLjFoNi4xMTNjMS4xNTMgMCAyLjA5LS45MjIgMi4xMDktMi4wNjV2LTMuMjQ3YTIuMTA0IDIuMTA0IDAgMCAwLTIuMDc0LTIuMXpNNC4xOCAxNS43MmEuNTU0LjU1NCAwIDAgMC0uNTU1LjU0MnYzLjczNGEuNTU2LjU1NiAwIDAgMCAuNzk4LjQ5NmwuMDEtLjAwNGwzLjQ2My0xLjc1NlYxNy41MWwtMy40NjctMS43M2EuNTYuNTYgMCAwIDAtLjI0OS0uMDZNOS4yOCAwYTUuNjcgNS42NyAwIDAgMSA0Ljk4IDIuOTY1YTQuOTIgNC45MiAwIDAgMSAzLjM2LTEuMzE3YzIuNzE0IDAgNC45MTMgMi4xNzcgNC45MTMgNC44NjNzLTIuMiA0Ljg2My00LjkxMiA0Ljg2M2E0LjkyIDQuOTIgMCAwIDEtMy45OTYtMi4wMzRhNS42NSA1LjY1IDAgMCAxLTQuMzQ1IDIuMDM0Yy0zLjEzMSAwLTUuNjctMi41NDYtNS42Ny01LjY4N1M2LjE0OSAwIDkuMjggMG04LjM0IDMuOTI2Yy0xLjQ0MSAwLTIuNjEgMS4xNTctMi42MSAyLjU4NXMxLjE2OSAyLjU4NSAyLjYxIDIuNTg1YzEuNDQzIDAgMi42MTItMS4xNTcgMi42MTItMi41ODVzLTEuMTY5LTIuNTg1LTIuNjExLTIuNTg1ek05LjI4IDIuMjg3YTMuMzk1IDMuMzk1IDAgMCAwLTMuMzkgMy40YzAgMS44NzcgMS41MTggMy40IDMuMzkgMy40YTMuMzk1IDMuMzk1IDAgMCAwIDMuMzktMy40YzAtMS44NzgtMS41MTgtMy40LTMuMzktMy40IiAvPgo8L3N2Zz4K',
    twitch: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxnIGZpbGw9Im5vbmUiPgoJCTxwYXRoIGQ9Im0xMi41OTQgMjMuMjU4bC0uMDEyLjAwMmwtLjA3MS4wMzVsLS4wMi4wMDRsLS4wMTQtLjAwNGwtLjA3MS0uMDM2cS0uMDE2LS4wMDQtLjAyNC4wMDZsLS4wMDQuMDFsLS4wMTcuNDI4bC4wMDUuMDJsLjAxLjAxM2wuMTA0LjA3NGwuMDE1LjAwNGwuMDEyLS4wMDRsLjEwNC0uMDc0bC4wMTItLjAxNmwuMDA0LS4wMTdsLS4wMTctLjQyN3EtLjAwNC0uMDE2LS4wMTYtLjAxOG0uMjY0LS4xMTNsLS4wMTQuMDAybC0uMTg0LjA5M2wtLjAxLjAxbC0uMDAzLjAxMWwuMDE4LjQzbC4wMDUuMDEybC4wMDguMDA4bC4yMDEuMDkycS4wMTkuMDA1LjAyOS0uMDA4bC4wMDQtLjAxNGwtLjAzNC0uNjE0cS0uMDA1LS4wMTktLjAyLS4wMjJtLS43MTUuMDAyYS4wMi4wMiAwIDAgMC0uMDI3LjAwNmwtLjAwNi4wMTRsLS4wMzQuNjE0cS4wMDEuMDE4LjAxNy4wMjRsLjAxNS0uMDAybC4yMDEtLjA5M2wuMDEtLjAwOGwuMDAzLS4wMTFsLjAxOC0uNDNsLS4wMDMtLjAxMmwtLjAxLS4wMXoiIC8+CgkJPHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMjAgMmExIDEgMCAwIDEgMSAxdjlhMSAxIDAgMCAxLS4yLjZsLTMgNHEtLjA3OC4xMDEtLjE3Ni4xOGwtMi40OTkgMi4wMDFBMSAxIDAgMCAxIDE0LjUgMTloLTMuMDg2bC0yLjcwNyAyLjcwN0ExIDEgMCAwIDEgNyAyMXYtMkg0YTEgMSAwIDAgMS0xLTFWNmwuMDA1LS4wOTlhMSAxIDAgMCAxIC4yODgtLjYwOGwzLTNBMSAxIDAgMCAxIDcgMnpNNiA1LjQxNGwtMSAxVjE3aDJhMSAxIDAgMCAxLTEtMXpNMTkgNEg4djExaDJhMSAxIDAgMCAxIDEgMXYuMzY0bDEuMzYtMS4xMzNBMSAxIDAgMCAxIDEzIDE1aDMuNTAxTDE5IDExLjY2N3ptLTcgMi41YTEgMSAwIDAgMSAxIDFWMTFhMSAxIDAgMSAxLTIgMFY3LjVhMSAxIDAgMCAxIDEtMW00IDBhMSAxIDAgMCAxIDEgMVYxMWExIDEgMCAxIDEtMiAwVjcuNWExIDEgMCAwIDEgMS0xIiAvPgoJPC9nPgo8L3N2Zz4K',
    youtube: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtZGFzaGFycmF5PSI2MCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiIGQ9Ik0xMiA1YzkgMCA5IDAgOSA3YzAgNyAwIDcgLTkgN2MtOSAwIC05IDAgLTkgLTdjMCAtNyAwIC03IDkgLTdaIj4KCQk8YW5pbWF0ZSBmaWxsPSJmcmVlemUiIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNob2Zmc2V0IiBkdXI9IjAuNnMiIHZhbHVlcz0iNjA7MCIgLz4KCTwvcGF0aD4KCTxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTEwIDguNWw2IDMuNWwtNiAzLjVaIiBvcGFjaXR5PSIwIj4KCQk8c2V0IGZpbGw9ImZyZWV6ZSIgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgYmVnaW49IjAuNnMiIHRvPSIxIiAvPgoJCTxhbmltYXRlIGZpbGw9ImZyZWV6ZSIgYXR0cmlidXRlTmFtZT0iZCIgYmVnaW49IjAuNnMiIGR1cj0iMC4ycyIgdmFsdWVzPSJNMTIgMTFsMCAxbDAgMVo7TTEwIDguNWw2IDMuNWwtNiAzLjVaIiAvPgoJPC9wYXRoPgo8L3N2Zz4K',
    generic: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CgkJPHBhdGggZD0ibTEyLjU5NCAyMy4yNThsLS4wMTIuMDAybC0uMDcxLjAzNWwtLjAyLjAwNGwtLjAxNC0uMDA0bC0uMDcxLS4wMzZxLS4wMTYtLjAwNC0uMDI0LjAwNmwtLjAwNC4wMWwtLjAxNy40MjhsLjAwNS4wMmwuMDEuMDEzbC4xMDQuMDc0bC4wMTUuMDA0bC4wMTItLjAwNGwuMTA0LS4wNzRsLjAxMi0uMDE2bC4wMDQtLjAxN2wtLjAxNy0uNDI3cS0uMDA0LS4wMTYtLjAxNi0uMDE4bS4yNjQtLjExM2wtLjAxNC4wMDJsLS4xODQuMDkzbC0uMDEuMDFsLS4wMDMuMDExbC4wMTguNDNsLjAwNS4wMTJsLjAwOC4wMDhsLjIwMS4wOTJxLjAxOS4wMDUuMDI5LS4wMDhsLjAwNC0uMDE0bC0uMDM0LS42MTRxLS4wMDUtLjAxOS0uMDItLjAyMm0tLjcxNS4wMDJhLjAyLjAyIDAgMCAwLS4wMjcuMDA2bC0uMDA2LjAxNGwtLjAzNC42MTRxLjAwMS4wMTguMDE3LjAyNGwuMDE1LS4wMDJsLjIwMS0uMDkzbC4wMS0uMDA4bC4wMDMtLjAxMWwuMDE4LS40M2wtLjAwMy0uMDEybC0uMDEtLjAxeiIgLz4KCQk8cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xNi45NSAyLjU4NmExIDEgMCAwIDEgMCAxLjQxNGwtMyAzSDE5YTIgMiAwIDAgMSAyIDJ2MTBhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJWOWEyIDIgMCAwIDEgMi0yaDMuNjM2TDcuMDUgNS40MTRBMSAxIDAgMCAxIDguNDY1IDRsMi40NzQgMi40NzVhLjUuNSAwIDAgMCAuNzA3IDBsMy44OS0zLjg5YTEgMSAwIDAgMSAxLjQxNCAwTTE5IDlINXYxMGgxNHpNOC45OCAxMS41NDdhMS4yMzIgMS4yMzIgMCAwIDEgMS43Mi0uOTk0YTIyIDIyIDAgMCAxIDIuMiAxLjEyM2EyMiAyMiAwIDAgMSAyLjA3NSAxLjM0NmMuNjY4LjQ5NC42NyAxLjQ4OSAwIDEuOTg0QTIyIDIyIDAgMCAxIDEyLjkgMTYuMzVjLS45OTcuNTc2LTEuNzg1Ljk0My0yLjIgMS4xMjRhMS4yMyAxLjIzIDAgMCAxLTEuNzItLjk5M2EyMyAyMyAwIDAgMS0uMTI4LTIuNDY3YzAtMS4xNC4wNzgtMi4wMTQuMTI4LTIuNDY3bTEuOTAyIDEuMzA2YTIzIDIzIDAgMCAwIDAgMi4zMmEyMyAyMyAwIDAgMCAyLjAwOC0xLjE2YTIzIDIzIDAgMCAwLTIuMDA4LTEuMTYiIC8+Cgk8L2c+Cjwvc3ZnPgo=',
};
function trimSlash(value) {
    return value.replace(/\/+$/, '');
}
function roomKey(room) {
    return `${room.platform || ''}|${room.name || ''}|${room.url}|${normalizeChannels(room.channels).join(',')}`;
}
function normalizePlatform(platform) {
    return !platform || platform === '自动识别' ? '' : platform;
}
function normalizeChannels(channels) {
    if (Array.isArray(channels))
        return channels.filter(Boolean);
    if (!channels)
        return [];
    return channels
        .split(/[,，\s]+/)
        .map(channel => channel.trim())
        .filter(Boolean);
}
function effectiveRoomChannels(room, defaultChannels = []) {
    const roomChannels = normalizeChannels(room.channels);
    return roomChannels.length ? roomChannels : defaultChannels;
}
function sessionChannelKeys(session) {
    const keys = new Set();
    if (!session)
        return keys;
    const rawIds = [session.channelId, session.guildId].filter(Boolean);
    for (const id of rawIds) {
        keys.add(id);
        if (session.platform)
            keys.add(`${session.platform}:${id}`);
    }
    return keys;
}
function roomVisibleInSession(room, defaultChannels, session) {
    const channels = effectiveRoomChannels(room, defaultChannels);
    if (!channels.length)
        return true;
    const keys = sessionChannelKeys(session);
    return channels.some(channel => keys.has(channel) || keys.has(channel.split(':').pop() || channel));
}
function expandBroadcastChannels(ctx, channels) {
    const result = new Set();
    for (const channel of channels) {
        if (channel.includes(':')) {
            result.add(channel);
            continue;
        }
        for (const bot of ctx.bots)
            result.add(`${bot.platform}:${channel}`);
    }
    return [...result];
}
function parseBroadcastChannel(channel) {
    const index = channel.indexOf(':');
    if (index < 0)
        return { channelId: channel };
    return {
        platform: channel.slice(0, index),
        channelId: channel.slice(index + 1),
    };
}
async function sendToChannels(ctx, channels, content) {
    const logger = ctx.logger('live-monitor');
    const messageIds = [];
    for (const channel of channels) {
        const target = parseBroadcastChannel(channel);
        const bots = target.platform
            ? ctx.bots.filter(bot => bot.platform === target.platform)
            : [...ctx.bots];
        if (!bots.length) {
            logger.warn(`没有找到可用于频道 ${channel} 的机器人，跳过推送。`);
            continue;
        }
        for (const bot of bots) {
            try {
                messageIds.push(...await bot.sendMessage(target.channelId, content));
            }
            catch (error) {
                logger.warn(`推送到频道 ${channel} 失败：${error}`);
            }
        }
    }
    return messageIds;
}
function platformKey(platform = '') {
    const value = platform.toLowerCase();
    if (value.includes('b站') || value.includes('bilibili'))
        return 'bilibili';
    if (value.includes('抖音') || value.includes('douyin') || value.includes('tiktok'))
        return 'douyin';
    if (value.includes('虎牙') || value.includes('huya'))
        return 'huya';
    if (value.includes('快手') || value.includes('kuaishou'))
        return 'kuaishou';
    if (value.includes('twitch'))
        return 'twitch';
    if (value.includes('youtube') || value.includes('youtu'))
        return 'youtube';
    if (value.includes('知乎') || value.includes('zhihu'))
        return 'zhihu';
    if (value.includes('微博') || value.includes('weibo'))
        return 'weibo';
    if (value.includes('小红书') || value.includes('xiaohongshu') || value.includes('xhs'))
        return 'xiaohongshu';
    if (value.includes('淘宝') || value.includes('taobao'))
        return 'taobao';
    if (value.includes('shopee'))
        return 'shopee';
    if (value.includes('chzzk'))
        return 'chzzk';
    if (value.includes('斗鱼') || value.includes('douyu'))
        return 'douyu';
    if (value.includes('acfun'))
        return 'acfun';
    return 'generic';
}
function platformTheme(platform = '') {
    const key = platformKey(platform);
    const themes = {
        bilibili: { key, accent: '#fb7299', accent2: '#65c5ef', plate: '#fff5f8', ink: '#332129' },
        douyin: { key, accent: '#111827', accent2: '#ff2d55', plate: '#f7f8fb', ink: '#111827' },
        huya: { key, accent: '#ff8a00', accent2: '#ffd166', plate: '#fff7ed', ink: '#2f2112' },
        kuaishou: { key, accent: '#ff5b2e', accent2: '#ffcf54', plate: '#fff4ed', ink: '#321b12' },
        twitch: { key, accent: '#9146ff', accent2: '#00d1ff', plate: '#f6f1ff', ink: '#201335' },
        youtube: { key, accent: '#ff0033', accent2: '#ffb703', plate: '#fff4f4', ink: '#2c1111' },
        zhihu: { key, accent: '#1772f6', accent2: '#63d2ff', plate: '#eff6ff', ink: '#10233f' },
        weibo: { key, accent: '#e6162d', accent2: '#ffb000', plate: '#fff4eb', ink: '#351b12' },
        xiaohongshu: { key, accent: '#ff2442', accent2: '#ff8fa3', plate: '#fff1f4', ink: '#37151d' },
        taobao: { key, accent: '#ff5000', accent2: '#ffd000', plate: '#fff4e8', ink: '#341b0d' },
        shopee: { key, accent: '#ee4d2d', accent2: '#ffbd59', plate: '#fff1ec', ink: '#35170f' },
        chzzk: { key, accent: '#00ffa3', accent2: '#00c27a', plate: '#effff8', ink: '#10251d' },
        douyu: { key, accent: '#ff6f00', accent2: '#ffe066', plate: '#fff7e8', ink: '#31210d' },
        acfun: { key, accent: '#fd4c5b', accent2: '#4cc9f0', plate: '#fff3f4', ink: '#32171a' },
        generic: { key, accent: '#2f80ed', accent2: '#27c2a0', plate: '#f3f8fb', ink: '#12202b' },
    };
    return themes[key] || themes.generic;
}
function generatedPlatformIcon(platform, theme) {
    const label = (platform || 'LIVE').replace(/直播/g, '').slice(0, 4).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><rect width="480" height="270" fill="${theme.plate}"/><rect x="32" y="30" width="416" height="210" rx="24" fill="none" stroke="${theme.accent}" stroke-width="8"/><circle cx="126" cy="135" r="48" fill="${theme.accent}"/><path d="M115 105v60l55-30z" fill="white"/><text x="240" y="148" text-anchor="middle" font-size="44" font-family="Microsoft YaHei, sans-serif" font-weight="700" fill="${theme.ink}">${escapeHtml(label)}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
function fallbackCover(status) {
    const theme = platformTheme(status.platform);
    return fallbackIcons[theme.key] || generatedPlatformIcon(status.platform, theme);
}
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function firstPresent(...values) {
    return values.find(value => value !== undefined && value !== null && value !== '');
}
function formatCount(value) {
    if (value === undefined || value === null || value === '')
        return '未知';
    if (typeof value === 'string' && /[万亿kK]/.test(value))
        return value;
    const number = Number(value);
    if (!Number.isFinite(number))
        return String(value);
    if (number >= 100000000)
        return `${(number / 100000000).toFixed(1).replace(/\.0$/, '')}亿`;
    if (number >= 10000)
        return `${(number / 10000).toFixed(1).replace(/\.0$/, '')}万`;
    return String(Math.trunc(number));
}
function formatDateTime(value) {
    if (!value)
        return '';
    const raw = String(value);
    const number = Number(raw);
    const date = Number.isFinite(number) && /^\d{10,13}$/.test(raw)
        ? new Date(number < 1000000000000 ? number * 1000 : number)
        : new Date(raw);
    if (Number.isNaN(date.getTime()))
        return raw;
    const pad = (input) => String(input).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function buildLiveCardHtml(status, started) {
    const theme = platformTheme(status.platform);
    const cover = status.cover_url || fallbackCover(status);
    const avatar = status.avatar_url || fallbackCover(status);
    const title = status.title || (started ? '直播间已开播' : '直播间已下播');
    const displayName = status.display_name || status.anchor_name || status.configured_name || status.url;
    const actionText = started ? '开播了' : '下播了';
    const stateLabel = started ? 'LIVE' : 'END';
    const stateText = started ? '正在直播' : '直播结束';
    const viewer = firstPresent(status.viewer_count, status.popularity);
    const timeText = formatDateTime(status.started_at);
    const durationText = status.live_duration || '';
    const area = status.area_name || status.category;
    const statItems = [];
    if (viewer !== undefined && viewer !== null && viewer !== '')
        statItems.push(['人气', formatCount(viewer)]);
    if (area)
        statItems.push(['分区', area]);
    if (started && durationText)
        statItems.push(['直播时长', durationText]);
    if (timeText)
        statItems.push([started ? '开播时间' : '结束时间', timeText]);
    const statsColumnCount = Math.min(Math.max(statItems.length, 1), 4);
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 860px; min-height: 500px; background: transparent; }
    body {
      font-family: "Microsoft YaHei", "Noto Sans CJK SC", "PingFang SC", sans-serif;
      color: ${theme.ink};
    }
    .card-root {
      width: 860px;
      padding: 18px;
      background: #ffffff;
    }
    .plate {
      width: 100%;
      padding: 14px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 10px 28px rgba(18, 24, 38, 0.14);
    }
    .card {
      overflow: hidden;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid rgba(20, 24, 32, 0.08);
    }
    .cover {
      position: relative;
      height: 276px;
      background: ${theme.plate};
      overflow: hidden;
    }
    .cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cover::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.42));
    }
    .badge-row {
      position: absolute;
      left: 18px;
      right: 18px;
      top: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 2;
    }
    .badge, .platform {
      height: 34px;
      display: inline-flex;
      align-items: center;
      padding: 0 14px;
      border-radius: 8px;
      font-size: 17px;
      font-weight: 800;
      color: #fff;
      background: ${started ? theme.accent : '#59616f'};
      box-shadow: 0 8px 20px rgba(0,0,0,0.18);
    }
    .platform {
      background: rgba(255,255,255,0.86);
      color: ${theme.ink};
      font-weight: 700;
    }
    .body {
      padding: 20px 22px 22px;
    }
    .headline {
      display: grid;
      grid-template-columns: 70px 1fr;
      gap: 16px;
      align-items: center;
    }
    .avatar {
      width: 70px;
      height: 70px;
      border-radius: 8px;
      overflow: hidden;
      background: ${theme.plate};
      border: 3px solid #fff;
      box-shadow: 0 8px 18px rgba(24, 30, 42, 0.16);
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .name-line {
      display: flex;
      align-items: baseline;
      gap: 12px;
      min-width: 0;
    }
    .name {
      max-width: 560px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 30px;
      line-height: 1.2;
      font-weight: 800;
    }
    .action {
      flex: none;
      color: ${theme.accent};
      font-size: 24px;
      font-weight: 800;
    }
    .title {
      margin-top: 7px;
      max-height: 58px;
      overflow: hidden;
      font-size: 21px;
      line-height: 1.38;
      color: #4a5568;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(${statsColumnCount}, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    .stat {
      min-width: 0;
      padding: 12px 14px;
      border-radius: 8px;
      background: linear-gradient(180deg, rgba(255,255,255,0.92), ${theme.plate});
      border: 1px solid rgba(20, 24, 32, 0.08);
    }
    .stat-label {
      color: #7a8494;
      font-size: 15px;
      line-height: 1.2;
    }
    .stat-value {
      margin-top: 5px;
      min-height: 25px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: ${theme.ink};
      font-size: 21px;
      line-height: 1.2;
      font-weight: 800;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: 17px;
      color: #7a8494;
      font-size: 15px;
    }
    .state {
      color: ${theme.accent};
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="card-root">
    <div class="plate">
      <div class="card">
        <div class="cover">
          <img src="${escapeHtml(cover)}" alt="cover">
          <div class="badge-row">
            <div class="badge">${escapeHtml(stateLabel)}</div>
            <div class="platform">${escapeHtml(status.platform || 'Live Monitor')}</div>
          </div>
        </div>
        <div class="body">
          <div class="headline">
            <div class="avatar"><img src="${escapeHtml(avatar)}" alt="avatar"></div>
            <div>
              <div class="name-line">
                <div class="name">${escapeHtml(displayName)}</div>
                <div class="action">${escapeHtml(actionText)}</div>
              </div>
              <div class="title">${escapeHtml(title)}</div>
            </div>
          </div>
          ${statItems.length ? `<div class="stats">
            ${statItems.map(([label, value]) => `<div class="stat"><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${escapeHtml(value)}</div></div>`).join('')}
          </div>` : ''}
          <div class="footer">
            <div class="state">${escapeHtml(stateText)}${timeText ? ` · ${escapeHtml(timeText)}` : ''}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
async function renderLiveCard(ctx, status, started) {
    const puppeteer = ctx.puppeteer;
    if (!puppeteer)
        return;
    let page;
    try {
        page = await puppeteer.page();
        await page.setViewport({ width: 860, height: 520, deviceScaleFactor: 2 });
        await page.setContent(buildLiveCardHtml(status, started), { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.evaluate(() => Promise.race([
            Promise.all(Array.from(document.images).map((img) => {
                if (img.complete)
                    return undefined;
                return new Promise(resolve => {
                    ;
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            })),
            new Promise(resolve => setTimeout(resolve, 5000)),
        ]));
        const element = await page.$('.card-root');
        if (!element)
            return;
        const image = await element.screenshot({ type: 'png' });
        await element.dispose();
        return Buffer.from(image);
    }
    catch (error) {
        ctx.logger('live-monitor').warn(`生成直播卡片失败：${error}`);
    }
    finally {
        if (page)
            await page.close().catch(() => undefined);
    }
}
function formatStatus(status) {
    const state = status.is_live ? '直播中' : '未开播';
    const platform = status.platform ? `[${status.platform}] ` : '';
    const title = status.title ? `\n标题：${status.title}` : '';
    const error = status.error ? `\n错误：${status.error}` : '';
    return `${platform}${status.display_name || status.url}：${state}${title}${error}\n${status.url}`;
}
function formatNotification(status, started) {
    const verb = started ? '开播了' : '下播了';
    const platform = status.platform ? `[${status.platform}] ` : '';
    const title = status.title ? `\n标题：${status.title}` : '';
    return `${platform}${status.display_name || status.url} ${verb}${title}\n${status.url}`;
}
function formatListItem(status, index) {
    const state = status.error ? '检测失败' : status.is_live ? '开播' : '未开播';
    const platform = status.platform ? `[${status.platform}] ` : '';
    const title = status.title ? ` - ${status.title}` : '';
    const error = status.error ? ` - ${status.error}` : '';
    return `${index + 1}. [${state}] ${platform}${status.display_name || status.url}${title}${error}`;
}
function apply(ctx, config) {
    const previous = new Map();
    const lastNotified = new Map();
    const defaultChannels = normalizeChannels(config.notifyChannels);
    let checking = false;
    async function requestStatus(room) {
        return await ctx.http.post(`${trimSlash(config.endpoint)}/api/check`, {
            platform: normalizePlatform(room.platform),
            name: room.name || '',
            url: room.url,
            trigger_push: false,
        }, {
            timeout: config.requestTimeout * 1000,
        });
    }
    async function notify(room, status, started, mentionAll = false) {
        const channels = expandBroadcastChannels(ctx, effectiveRoomChannels(room, defaultChannels));
        if (!channels.length) {
            ctx.logger('live-monitor').warn(`没有配置有效的通知频道，跳过直播间 ${room.url} 的推送。`);
            return;
        }
        const message = formatNotification(status, started);
        const shouldMentionAll = started && mentionAll && room.mentionAllOnStart === true;
        const mentionPrefix = shouldMentionAll ? [(0, koishi_1.h)('at', { type: 'all' }), koishi_1.h.text('\n')] : [];
        if (config.notificationStyle === '纯文字') {
            await sendToChannels(ctx, channels, shouldMentionAll ? [...mentionPrefix, koishi_1.h.text(message)] : message);
            return;
        }
        const image = await renderLiveCard(ctx, status, started);
        if (image) {
            const content = [...mentionPrefix, koishi_1.h.image(image, 'image/png'), koishi_1.h.text(`\n${status.url}`)];
            await sendToChannels(ctx, channels, content);
            return;
        }
        await sendToChannels(ctx, channels, shouldMentionAll ? [...mentionPrefix, koishi_1.h.text(message)] : message);
    }
    async function checkRoom(room, manual = false) {
        if (room.enabled === false)
            return;
        try {
            const status = await requestStatus(room);
            if (manual)
                return status;
            if (status.error) {
                ctx.logger('live-monitor').warn(`检测失败，保留直播间 ${room.url} 的上一次状态：${status.error}`);
                return status;
            }
            const key = roomKey(room);
            const oldState = previous.get(key);
            previous.set(key, status.is_live);
            const now = Date.now();
            const lastTime = lastNotified.get(key) || 0;
            const shouldRemind = config.liveReminderInterval > 0 &&
                status.is_live &&
                lastTime > 0 &&
                (now - lastTime) >= config.liveReminderInterval * 60 * 1000;
            if (oldState === undefined) {
                if (status.is_live) {
                    if (config.notifyOnFirstLive) {
                        await notify(room, status, true);
                        lastNotified.set(key, now);
                    }
                    else {
                        lastNotified.set(key, now);
                    }
                }
            }
            else if (!oldState && status.is_live) {
                if (config.notifyOnStart) {
                    await notify(room, status, true, true);
                }
                lastNotified.set(key, now);
            }
            else if (oldState && !status.is_live) {
                if (config.notifyOnEnd) {
                    await notify(room, status, false);
                }
                lastNotified.delete(key);
            }
            else if (status.is_live && shouldRemind) {
                await notify(room, status, true);
                lastNotified.set(key, now);
            }
            return status;
        }
        catch (error) {
            ctx.logger('live-monitor').warn(`检测失败：${room.url} ${error}`);
        }
    }
    async function checkRooms(rooms, manual = false) {
        const promises = rooms.map(room => checkRoom(room, manual));
        const results = await Promise.all(promises);
        return results.filter((status) => !!status);
    }
    function getEnabledRooms(session) {
        return (config.rooms || [])
            .filter(room => room.enabled !== false && room.url)
            .filter(room => roomVisibleInSession(room, defaultChannels, session));
    }
    async function checkAll(manual = false) {
        if (!manual && checking) {
            ctx.logger('live-monitor').warn('上一次直播状态轮询尚未完成，跳过本轮检查。');
            return [];
        }
        if (!manual)
            checking = true;
        const rooms = (config.rooms || []).filter(room => room.enabled !== false && room.url);
        try {
            return await checkRooms(rooms, manual);
        }
        finally {
            if (!manual)
                checking = false;
        }
    }
    ctx.on('ready', () => {
        void checkAll(false);
    });
    if (config.pollInterval > 0) {
        ctx.setInterval(() => {
            void checkAll(false);
        }, config.pollInterval * 1000);
    }
    ctx.command('live-monitor.list', '查看本群可见的直播间列表')
        .action(async ({ session }) => {
        const rooms = getEnabledRooms(session);
        if (!rooms.length)
            return '当前群没有可见的直播监控项。';
        const statuses = await checkRooms(rooms, true);
        if (!statuses.length)
            return '没有启用的直播监控项，或后端暂时不可用。';
        return statuses.map(formatListItem).join('\n');
    });
    ctx.command('live-monitor.status', '发送本群当前开播直播间卡片')
        .action(async ({ session }) => {
        if (!session)
            return '只能在会话中使用这个命令。';
        const rooms = getEnabledRooms(session);
        if (!rooms.length)
            return '当前群没有绑定或可见的直播监控项。';
        const statuses = await checkRooms(rooms, true);
        const liveStatuses = statuses.filter(status => status.is_live);
        if (!liveStatuses.length)
            return '当前群可见的直播间都还没有开播。';
        for (const status of liveStatuses) {
            if (config.notificationStyle === '纯文字') {
                await session.send(formatNotification(status, true));
                continue;
            }
            const image = await renderLiveCard(ctx, status, true);
            if (image) {
                await session.send([koishi_1.h.image(image, 'image/png'), koishi_1.h.text(`\n${status.url}`)]);
            }
            else {
                await session.send(formatNotification(status, true));
            }
        }
    });
}
