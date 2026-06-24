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
    endpoint: koishi_1.Schema.string().default('http://127.0.0.1:8000').description('Live Monitor 后端 API 地址。使用前请先部署后端服务，详见 [Live-Monitor 仓库](https://github.com/lumia1998/Live-Monitor)。'),
    apiToken: koishi_1.Schema.string().role('secret').default('').description('Live Monitor 后端 API 访问令牌。后端 config.ini 配置 API访问令牌 后，这里填写同一个值。'),
    pollInterval: koishi_1.Schema.number().min(30).default(300).description('轮询间隔，单位秒'),
    requestTimeout: koishi_1.Schema.number().min(3).default(15).description('请求后端超时时间，单位秒'),
    notifyOnStart: koishi_1.Schema.boolean().default(true).description('检测到开播时推送'),
    notifyOnEnd: koishi_1.Schema.boolean().default(true).description('检测到关播时推送。需要插件运行期间先检测到该主播开播。'),
    notifyOnFirstLive: koishi_1.Schema.boolean().default(false).description('插件启动后首次检测到已开播也推送'),
    liveReminderInterval: koishi_1.Schema.number().min(0).default(30).description('正在直播中的主播重复推送提醒间隔（分钟），默认每 30 分钟提醒一次；设为 0 表示不重复推送（仅开/关播时推送）。'),
    notificationStyle: koishi_1.Schema.union(['图片卡片', '纯文字']).default('图片卡片').description('通知样式。图片卡片会在同一条消息中发送卡片图片和直播地址；纯文字只发送文本。'),
    rooms: koishi_1.Schema.array(koishi_1.Schema.object({
        platform: platformSchema.description('平台。选自动识别时，后端会根据直播地址判断。'),
        name: koishi_1.Schema.string().description('主播展示名，可留空使用后端解析结果'),
        url: koishi_1.Schema.string().required().description('直播间地址'),
        enabled: koishi_1.Schema.boolean().default(true).description('是否启用监控'),
        channels: koishi_1.Schema.string().default('').description('绑定频道 ID。多个频道用逗号分隔；留空时不会自动推送，但仍可通过命令查看。'),
        mentionAllOnStart: koishi_1.Schema.boolean().default(false).description('开播推送时 @全体成员。只对该行绑定的频道生效；重复提醒不会 @全体。'),
    })).role('table').default([]).description('关注主播列表'),
});
const fallbackIcons = {
    bilibili: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CgkJPHBhdGggZD0ibTEyLjU5NCAyMy4yNThsLS4wMTIuMDAybC0uMDcxLjAzNWwtLjAyLjAwNGwtLjAxNC0uMDA0bC0uMDcxLS4wMzZxLS4wMTYtLjAwNC0uMDI0LjAwNmwtLjAwNC4wMWwtLjAxNy40MjhsLjAwNS4wMmwuMDEuMDEzbC4xMDQuMDc0bC4wMTUuMDA0bC4wMTItLjAwNGwuMTA0LS4wNzRsLjAxMi0uMDE2bC4wMDQtLjAxN2wtLjAxNy0uNDI3cS0uMDA0LS4wMTYtLjAxNi0uMDE4bS4yNjQtLjExM2wtLjAxNC4wMDJsLS4xODQuMDkzbC0uMDEuMDFsLS4wMDMuMDExbC4wMTguNDNsLjAwNS4wMTJsLjAwOC4wMDhsLjIwMS4wOTJxLjAxOS4wMDUuMDI5LS4wMDhsLjAwNC0uMDE0bC0uMDM0LS42MTRxLS4wMDUtLjAxOS0uMDItLjAyMm0tLjcxNS4wMDJhLjAyLjAyIDAgMCAwLS4wMjcuMDA2bC0uMDA2LjAxNGwtLjAzNC42MTRxLjAwMS4wMTguMDE3LjAyNGwuMDE1LS4wMDJsLjIwMS0uMDkzbC4wMS0uMDA4bC4wMDMtLjAxMWwuMDE4LS40M2wtLjAwMy0uMDEybC0uMDEtLjAxeiIgLz4KCQk8cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik02LjQ0NSAzLjE2OGExIDEgMCAwIDEgMS4zODcuMjc3TDkuNTM1IDZoNC45M2wxLjcwMy0yLjU1NWExIDEgMCAwIDEgMS42NjQgMS4xMUwxNi44NyA2SDE4YTQgNCAwIDAgMSA0IDR2N2E0IDQgMCAwIDEtNCA0SDZhNCA0IDAgMCAxLTQtNHYtN2E0IDQgMCAwIDEgNC00aDEuMTMxbC0uOTYzLTEuNDQ1YTEgMSAwIDAgMSAuMjc3LTEuMzg3TTguOTg2IDhINmEyIDIgMCAwIDAtMiAydjdhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0ydi03YTIgMiAwIDAgMC0yLTJIOS4wMTZ6TTkgMTFhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDEgMS0yIDB2LTJhMSAxIDAgMCAxIDEtMW02IDBhMSAxIDAgMCAxIDEgMXYyYTEgMSAwIDEgMS0yIDB2LTJhMSAxIDAgMCAxIDEtMSIgLz4KCTwvZz4KPC9zdmc+Cg==',
    douyin: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTE2LjYgNS44MnMuNTEuNSAwIDBBNC4yOCA0LjI4IDAgMCAxIDE1LjU0IDNoLTMuMDl2MTIuNGEyLjU5IDIuNTkgMCAwIDEtMi41OSAyLjVjLTEuNDIgMC0yLjYtMS4xNi0yLjYtMi42YzAtMS43MiAxLjY2LTMuMDEgMy4zNy0yLjQ4VjkuNjZjLTMuNDUtLjQ2LTYuNDcgMi4yMi02LjQ3IDUuNjRjMCAzLjMzIDIuNzYgNS43IDUuNjkgNS43YzMuMTQgMCA1LjY5LTIuNTUgNS42OS01LjdWOS4wMWE3LjM1IDcuMzUgMCAwIDAgNC4zIDEuMzhWNy4zcy0xLjg4LjA5LTMuMjQtMS40OCIgLz4KPC9zdmc+Cg==',
    huya: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgNDggNDgiPgoJPHBhdGggZD0iTTAgMGg0OHY0OEgweiIgZmlsbD0ibm9uZSIgLz4KCTxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPgoJCTxwYXRoIGQ9Ik0zNi40OTUgMTQuMTQzYzguNjgxIDkuMzggNi42ODggMTguMTU4IDIuMDMyIDIyLjIzNGMtMi44NDcgMi40OTItNy4xMSAzLjkxOS0xMS45MzUgNC4yNzhjLTkuMTEyLjY3Ny0xOC43Ny0xLjg2My0yMC43NzctMTEuMDIzYy0uODA2LTMuNjc4LS4zNjMtOC43NjQgNC4wNjgtMTMuNDljLjAwNy0zLjU4Ni45My01LjgwNiAyLjYzNi04LjQ3NGExNCAxNCAwIDAgMSA2LjYyOCAyLjIwM2MyLjMzOS0uNzM1IDQuMTE1LS44NjggNi4zNzItLjU4MmMxLjE4Ni0uOTE5IDEuODM3LTEuNTYyIDMuMTQzLTIuMDQ3YzQuMTkgMS43NzIgNS45OTQgMy45MzggNy44MzMgNi45IiAvPgoJCTxwYXRoIGQ9Ik0xOC44NTcgMzIuMzkxYzEuOTQzIDIuNDE3IDExLjgxNSAxLjU2IDE0LjA5Mi0xLjI1NCIgLz4KCQk8cGF0aCBkPSJNMzIuNzMgMzEuMzgyYy0uMjIzIDEuNDI3LS4wMDUgMi43MjItLjU5MiAzLjg1M2MtMS4wNjMtLjMxLTIuMjU4LTEuMDYzLTIuODM3LTIuMTRtLTYuMzgxLjY3NWMtLjQxOCAxLjA0OC0xLjIxNyAxLjg5NC0yLjM2MiAyLjUwNGMtLjgyMy0xLjAwMy0xLjM2MS0yLjI4Ny0xLjQwMi0zLjU4NE01Ljg1NyAyOS44MTRjMS40MTYtLjg2MSAzLjI2Ni0xLjM4MiA1LjM4OC0xLjU3NWMtMS41NzMgMS42Ni0yLjk0IDMuNDIyLTMuODMgNS40MjRtMi4xMjUgMi41NzhjMS40MjQtMS45ODUgMy4zNC0zLjM3NCA1LjY5OS00LjAxN2MtMS4yMjcgMS45NzUtMS42ODUgNC40MjQtMS41NDUgNi42NzNtMjguNjM5LTkuNDYxYy0uNzUyLTEuMDY2LTEuNzA3LTIuMDY0LTMuMjAzLTMuMThjMS4xOTUtLjE3IDIuMTU1LS4wODQgMy4zNDkuMjMzbS0zLjc0IDkuNjk1Yy0uMy0xLjcxNi0xLjA3Mi0zLjg2NC0yLjYxOS01LjQ4YTkuNTMgOS41MyAwIDAgMSA1LjA4OSAyLjE4Mk0zMC4xNzQgMjAuMjc4Yy4wODYgMS43MTctNS42MDIgNS40NTQtNy4xMSA0LjY3MXMtMS44NTQtNy42NDgtLjQzMi04LjU4M2MxLjQyMi0uOTM0IDcuNDU1IDIuMTk1IDcuNTQyIDMuOTEyIiAvPgoJCTxwYXRoIGQ9Ik0yNS43MjQgMjguOTg0YzcuNTYtLjY2IDExLjgxNy0uODcgMTIuODA0LTQuOTNjMS4yMjctNS4wNDYtNS41ODItMTIuNjk3LTE0LjMyMS0xMS45MzRjLTYuMjc3LjU0Ny0xMi42NSA0LjgyMS0xMi41MiAxMS43NjVjLjEwOSA1Ljg0NSA0LjQ4NSA1LjkzMyAxNC4wMzcgNS4xIiAvPgoJPC9nPgo8L3N2Zz4K',
    kuaishou: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTE4LjMxNSAxMi4yNjRjMi4zMyAwIDQuMjE4IDEuODggNC4yMTggNC4yVjE5LjhjMCAyLjMyLTEuODg4IDQuMi00LjIxOCA0LjJoLTYuMjAyYTQuMjIgNC4yMiAwIDAgMS00LjAyMy0yLjkzOGwtMy42NzYgMS44MzNhMi4wNCAyLjA0IDAgMCAxLTIuNzMxLS45MDNhMiAyIDAgMCAxLS4yMTYtLjkwN3YtNS45NGEyLjAzIDIuMDMgMCAwIDEgMi4wMzUtMi4wMjRhMi4wNCAyLjA0IDAgMCAxIC45MTkuMjE4bDMuNjczIDEuODVhNC4yMiA0LjIyIDAgMCAxIDQuMDItMi45MjV6bS0uMDYyIDIuMTYyaC02LjA3OGMtMS4xNTMgMC0yLjA5LjkyMS0yLjEwOCAyLjA2NXYzLjI0N2MwIDEuMTQ4LjkyNSAyLjA4MSAyLjA3MyAyLjFoNi4xMTNjMS4xNTMgMCAyLjA5LS45MjIgMi4xMDktMi4wNjV2LTMuMjQ3YTIuMTA0IDIuMTA0IDAgMCAwLTIuMDc0LTIuMXpNNC4xOCAxNS43MmEuNTU0LjU1NCAwIDAgMC0uNTU1LjU0MnYzLjczNGEuNTU2LjU1NiAwIDAgMCAuNzk4LjQ5NmwuMDEtLjAwNGwzLjQ2My0xLjc1NlYxNy41MWwtMy40NjctMS43M2EuNTYuNTYgMCAwIDAtLjI0OS0uMDZNOS4yOCAwYTUuNjcgNS42NyAwIDAgMSA0Ljk4IDIuOTY1YTQuOTIgNC45MiAwIDAgMSAzLjM2LTEuMzE3YzIuNzE0IDAgNC45MTMgMi4xNzcgNC45MTMgNC44NjNzLTIuMiA0Ljg2My00LjkxMiA0Ljg2M2E0LjkyIDQuOTIgMCAwIDEtMy45OTYtMi4wMzRhNS42NSA1LjY1IDAgMCAxLTQuMzQ1IDIuMDM0Yy0zLjEzMSAwLTUuNjctMi41NDYtNS42Ny01LjY4N1M2LjE0OSAwIDkuMjggMG04LjM0IDMuOTI2Yy0xLjQ0MSAwLTIuNjEgMS4xNTctMi42MSAyLjU4NXMxLjE2OSAyLjU4NSAyLjYxIDIuNTg1YzEuNDQzIDAgMi42MTItMS4xNTcgMi42MTItMi41ODVzLTEuMTY5LTIuNTg1LTIuNjExLTIuNTg1ek05LjI4IDIuMjg3YTMuMzk1IDMuMzk1IDAgMCAwLTMuMzkgMy40YzAgMS44NzcgMS41MTggMy40IDMuMzkgMy40YTMuMzk1IDMuMzk1IDAgMCAwIDMuMzktMy40YzAtMS44NzgtMS41MTgtMy40LTMuMzktMy40IiAvPgo8L3N2Zz4K',
    twitch: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxnIGZpbGw9Im5vbmUiPgoJCTxwYXRoIGQ9Im0xMi41OTQgMjMuMjU4bC0uMDEyLjAwMmwtLjA3MS4wMzVsLS4wMi4wMDRsLS4wMTQtLjAwNGwtLjA3MS0uMDM2cS0uMDE2LS4wMDQtLjAyNC4wMDZsLS4wMDQuMDFsLS4wMTcuNDI4bC4wMDUuMDJsLjAxLjAxM2wuMTA0LjA3NGwuMDE1LjAwNGwuMDEyLS4wMDRsLjEwNC0uMDc0bC4wMTItLjAxNmwuMDA0LS4wMTdsLS4wMTctLjQyN3EtLjAwNC0uMDE2LS4wMTYtLjAxOG0uMjY0LS4xMTNsLS4wMTQuMDAybC0uMTg0LjA5M2wtLjAxLjAxbC0uMDAzLjAxMWwuMDE4LjQzbC4wMDUuMDEybC4wMDguMDA4bC4yMDEuMDkycS4wMTkuMDA1LjAyOS0uMDA4bC4wMDQtLjAxNGwtLjAzNC0uNjE0cS0uMDA1LS4wMTktLjAyLS4wMjJtLS43MTUuMDAyYS4wMi4wMiAwIDAgMC0uMDI3LjAwNmwtLjAwNi4wMTRsLS4wMzQuNjE0cS4wMDEuMDE4LjAxNy4wMjRsLjAxNS0uMDAybC4yMDEtLjA5M2wuMDEtLjAwOGwuMDAzLS4wMTFsLjAxOC0uNDNsLS4wMDMtLjAxMmwtLjAxLS4wMXoiIC8+CgkJPHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMjAgMmExIDEgMCAwIDEgMSAxdjlhMSAxIDAgMCAxLS4yLjZsLTMgNHEtLjA3OC4xMDEtLjE3Ni4xOGwtMi40OTkgMi4wMDFBMSAxIDAgMCAxIDE0LjUgMTloLTMuMDg2bC0yLjcwNyAyLjcwN0ExIDEgMCAwIDEgNyAyMXYtMkg0YTEgMSAwIDAgMS0xLTFWNmwuMDA1LS4wOTlhMSAxIDAgMCAxIC4yODgtLjYwOGwzLTNBMSAxIDAgMCAxIDcgMnpNNiA1LjQxNGwtMSAxVjE3aDJhMSAxIDAgMCAxLTEtMXpNMTkgNEg4djExaDJhMSAxIDAgMCAxIDEgMXYuMzY0bDEuMzYtMS4xMzNBMSAxIDAgMCAxIDEzIDE1aDMuNTAxTDE5IDExLjY2N3ptLTcgMi41YTEgMSAwIDAgMSAxIDFWMTFhMSAxIDAgMSAxLTIgMFY3LjVhMSAxIDAgMCAxIDEtMW00IDBhMSAxIDAgMCAxIDEgMVYxMWExIDEgMCAxIDEtMiAwVjcuNWExIDEgMCAwIDEgMS0xIiAvPgoJPC9nPgo8L3N2Zz4K',
    youtube: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtZGFzaGFycmF5PSI2MCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiIGQ9Ik0xMiA1YzkgMCA5IDAgOSA3YzAgNyAwIDcgLTkgN2MtOSAwIC05IDAgLTkgLTdjMCAtNyAwIC03IDkgLTdaIj4KCQk8YW5pbWF0ZSBmaWxsPSJmcmVlemUiIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNob2Zmc2V0IiBkdXI9IjAuNnMiIHZhbHVlcz0iNjA7MCIgLz4KCTwvcGF0aD4KCTxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTEwIDguNWw2IDMuNWwtNiAzLjVaIiBvcGFjaXR5PSIwIj4KCQk8c2V0IGZpbGw9ImZyZWV6ZSIgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgYmVnaW49IjAuNnMiIHRvPSIxIiAvPgoJCTxhbmltYXRlIGZpbGw9ImZyZWV6ZSIgYXR0cmlidXRlTmFtZT0iZCIgYmVnaW49IjAuNnMiIGR1cj0iMC4ycyIgdmFsdWVzPSJNMTIgMTFsMCAxbDAgMVo7TTEwIDguNWw2IDMuNWwtNiAzLjVaIiAvPgoJPC9wYXRoPgo8L3N2Zz4K',
    generic: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgoJPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIgLz4KCTxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CgkJPHBhdGggZD0ibTEyLjU5NCAyMy4yNThsLS4wMTIuMDAybC0uMDcxLjAzNWwtLjAyLjAwNGwtLjAxNC0uMDA0bC0uMDcxLS4wMzZxLS4wMTYtLjAwNC0uMDI0LjAwNmwtLjAwNC4wMWwtLjAxNy40MjhsLjAwNS4wMmwuMDEuMDEzbC4xMDQuMDc0bC4wMTUuMDA0bC4wMTItLjAwNGwuMTA0LS4wNzRsLjAxMi0uMDE2bC4wMDQtLjAxN2wtLjAxNy0uNDI3cS0uMDA0LS4wMTYtLjAxNi0uMDE4bS4yNjQtLjExM2wtLjAxNC4wMDJsLS4xODQuMDkzbC0uMDEuMDFsLS4wMDMuMDExbC4wMTguNDNsLjAwNS4wMTJsLjAwOC4wMDhsLjIwMS4wOTJxLjAxOS4wMDUuMDI5LS4wMDhsLjAwNC0uMDE0bC0uMDM0LS42MTRxLS4wMDUtLjAxOS0uMDItLjAyMm0tLjcxNS4wMDJhLjAyLjAyIDAgMCAwLS4wMjcuMDA2bC0uMDA2LjAxNGwtLjAzNC42MTRxLjAwMS4wMTguMDE3LjAyNGwuMDE1LS4wMDJsLjIwMS0uMDkzbC4wMS0uMDA4bC4wMDMtLjAxMWwuMDE4LS40M2wtLjAwMy0uMDEybC0uMDEtLjAxeiIgLz4KCQk8cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xNi45NSAyLjU4NmExIDEgMCAwIDEgMCAxLjQxNGwtMyAzSDE5YTIgMiAwIDAgMSAyIDJ2MTBhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJWOWEyIDIgMCAwIDEgMi0yaDMuNjM2TDcuMDUgNS40MTRBMSAxIDAgMCAxIDguNDY1IDRsMi40NzQgMi40NzVhLjUuNSAwIDAgMCAuNzA3IDBsMy44OS0zLjg5YTEgMSAwIDAgMSAxLjQxNCAwTTE5IDlINXYxMGgxNHpNOC45OCAxMS41NDdhMS4yMzIgMS4yMzIgMCAwIDEgMS43Mi0uOTk0YTIyIDIyIDAgMCAxIDIuMiAxLjEyM2EyMiAyMiAwIDAgMSAyLjA3NSAxLjM0NmMuNjY4LjQ5NC42NyAxLjQ4OSAwIDEuOTg0QTIyIDIyIDAgMCAxIDEyLjkgMTYuMzVjLS45OTcuNTc2LTEuNzg1Ljk0My0yLjIgMS4xMjRhMS4yMyAxLjIzIDAgMCAxLTEuNzItLjk5M2EyMyAyMyAwIDAgMS0uMTI4LTIuNDY3YzAtMS4xNC4wNzgtMi4wMTQuMTI4LTIuNDY3bTEuOTAyIDEuMzA2YTIzIDIzIDAgMCAwIDAgMi4zMmEyMyAyMyAwIDAgMCAyLjAwOC0xLjE2YTIzIDIzIDAgMCAwLTIuMDA4LTEuMTYiIC8+Cgk8L2c+Cjwvc3ZnPgo=',
};
function trimSlash(value) {
    return value.replace(/\/+$/, '');
}
function roomKey(room) {
    return `${room.platform || ''}\x00${room.name || ''}\x00${room.url}\x00${normalizeChannels(room.channels).join(',')}`;
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
function effectiveRoomChannels(room) {
    return normalizeChannels(room.channels);
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
function roomVisibleInSession(room, session) {
    const channels = effectiveRoomChannels(room);
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
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
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
function buildLiveCardHtml(status, started, images = {}) {
    const theme = platformTheme(status.platform);
    const cover = images.cover || fallbackCover(status);
    const avatar = images.avatar || fallbackCover(status);
    const title = status.title || (started ? '直播间已开播' : '直播间已下播');
    const displayName = status.display_name || status.anchor_name || status.configured_name || status.url;
    const stateText = started ? '直播中' : '已下播';
    const viewer = firstPresent(status.viewer_count, status.popularity);
    const likeCount = firstPresent(status.like_count);
    const timeText = formatDateTime(status.started_at || status.detected_started_at);
    const durationText = status.live_duration || '';
    const area = status.area_name || status.category;
    const statusLineItems = [];
    if (viewer !== undefined && viewer !== null && viewer !== '')
        statusLineItems.push(`人气：${formatCount(viewer)}`);
    if (area)
        statusLineItems.push(`分区：${area}`);
    if (likeCount !== undefined && likeCount !== null && likeCount !== '')
        statusLineItems.push(`点赞：${formatCount(likeCount)}`);
    const primaryStats = statusLineItems.join('　');
    const durationStat = durationText ? `${started ? '直播时长' : '总直播时长'}：${durationText}` : '';
    const timeStat = timeText ? `${started ? '开播时间' : '结束时间'}：${timeText}` : '';
    const hasStats = primaryStats || durationStat || timeStat;
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 640px; min-height: 360px; background: transparent; }
    body {
      font-family: "Microsoft YaHei", "Noto Sans CJK SC", "PingFang SC", sans-serif;
      color: #18191c;
    }
    .card-root {
      width: 640px;
      padding: 0;
      background: transparent;
    }
    .card {
      overflow: hidden;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.10);
    }
    .cover {
      position: relative;
      height: 245px;
      background: ${theme.plate};
      overflow: hidden;
    }
    .cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cover.offline img {
      filter: grayscale(0.5) brightness(0.55);
    }
    .badge {
      position: absolute;
      top: 12px;
      right: 12px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      padding: 0 10px;
      border-radius: 8px;
      color: #ffffff;
      background: ${started ? theme.accent : '#64748b'};
      font-size: 13px;
      font-weight: 800;
    }
    .cover-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(20, 22, 32, 0.15) 0%, rgba(15, 17, 27, 0.45) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .overlay-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .overlay-icon svg {
      width: 22px;
      height: 22px;
    }
    .cover-overlay .overlay-text {
      color: rgba(255, 255, 255, 0.88);
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 4px;
      text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
    }
    .body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 150px;
      gap: 16px;
      padding: 16px 18px 12px;
    }
    .main {
      min-width: 0;
    }
    .title {
      min-height: 58px;
      max-height: 58px;
      overflow: hidden;
      color: #111827;
      font-size: 24px;
      line-height: 1.22;
      font-weight: 900;
    }
    .subline {
      margin-top: 8px;
      overflow: hidden;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.3;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .streamer {
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
    .avatar {
      width: 44px;
      height: 44px;
      flex: none;
      overflow: hidden;
      border-radius: 50%;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .name {
      min-width: 0;
      overflow: hidden;
      color: #374151;
      font-size: 13px;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status {
      margin-top: 3px;
      color: ${started ? theme.accent : '#94a3b8'};
      font-size: 12px;
      line-height: 1.2;
      font-weight: 700;
      text-align: right;
    }
    .stats {
      padding: 0 18px 15px;
      color: #4b5563;
      font-size: 14px;
      line-height: 1.55;
    }
    .primary-stats {
      min-height: 22px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta-row {
      min-height: 22px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
    }
    .meta-row span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .time-stat {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="card-root">
    <div class="card">
      <div class="cover${started ? '' : ' offline'}">
        <img src="${escapeHtml(cover)}" alt="cover">
        <div class="badge">${escapeHtml(stateText)}</div>
        ${started ? '' : `<div class="cover-overlay">
          <div class="overlay-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16" rx="1"></rect>
              <rect x="14" y="4" width="4" height="16" rx="1"></rect>
            </svg>
          </div>
          <span class="overlay-text">直播已结束</span>
        </div>`}
      </div>
      <div class="body">
        <div class="main">
          <div class="title">${escapeHtml(title)}</div>
          <div class="subline">${escapeHtml(status.platform || 'Live Monitor')}</div>
        </div>
        <div class="streamer">
          <div class="avatar"><img src="${escapeHtml(avatar)}" alt="avatar"></div>
          <div style="min-width: 0;">
            <div class="name">${escapeHtml(displayName)}</div>
            <div class="status">${escapeHtml(started ? '正在直播' : '直播结束')}</div>
          </div>
        </div>
      </div>
      ${hasStats ? `<div class="stats">
        ${primaryStats ? `<div class="primary-stats">${escapeHtml(primaryStats)}</div>` : ''}
        ${durationStat || timeStat ? `<div class="meta-row">
          <span>${escapeHtml(durationStat)}</span>
          ${timeStat ? `<span class="time-stat">${escapeHtml(timeStat)}</span>` : ''}
        </div>` : ''}
      </div>` : ''}
    </div>
  </div>
</body>
</html>`;
}
async function waitForImages(page) {
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
}
function detectImageMime(buffer) {
    if (buffer.length >= 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP')
        return 'image/webp';
    if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
        return 'image/png';
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
        return 'image/jpeg';
    if (buffer.length >= 3 && buffer.slice(0, 3).toString('ascii') === 'GIF')
        return 'image/gif';
    return undefined;
}
function imageReferer(url, fallback) {
    if (fallback)
        return fallback;
    try {
        return `${new URL(url).origin}/`;
    }
    catch {
        return undefined;
    }
}
async function fetchImageDataUrl(ctx, url, referer) {
    if (!url)
        return;
    if (url.startsWith('data:'))
        return url;
    if (!/^https?:\/\//i.test(url))
        return url;
    try {
        const data = await ctx.http.get(url, {
            responseType: 'arraybuffer',
            timeout: 8000,
            headers: {
                ...(imageReferer(url, referer) ? { Referer: imageReferer(url, referer) } : {}),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
            },
        });
        const buffer = Buffer.from(data);
        if (!buffer.length)
            return;
        const mime = detectImageMime(buffer);
        if (!mime)
            return;
        return `data:${mime};base64,${buffer.toString('base64')}`;
    }
    catch (error) {
        ctx.logger('live-monitor').debug(`下载直播卡片图片失败：${url} ${error}`);
    }
}
async function prepareLiveCardImages(ctx, status) {
    const avatar = await fetchImageDataUrl(ctx, status.avatar_url, status.url);
    const cover = await fetchImageDataUrl(ctx, status.cover_url, status.url);
    return { cover, avatar };
}
async function renderLiveCard(ctx, status, started) {
    const puppeteer = ctx.puppeteer;
    if (!puppeteer)
        return;
    let page;
    try {
        const images = await prepareLiveCardImages(ctx, status);
        page = await puppeteer.page();
        await page.setViewport({ width: 640, height: 430, deviceScaleFactor: 2 });
        await page.setContent(buildLiveCardHtml(status, started, images), { waitUntil: 'domcontentloaded', timeout: 15000 });
        await waitForImages(page);
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
function formatDurationSeconds(seconds) {
    if (seconds < 60) {
        return '不足1分钟';
    }
    let minutes = Math.floor(seconds / 60);
    const days = Math.floor(minutes / (24 * 60));
    minutes = minutes % (24 * 60);
    const hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    if (days) {
        return `${days}天${hours}小时`;
    }
    if (hours) {
        return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
}
function formatNotification(status, started, ongoing = false) {
    const name = status.display_name || status.url;
    if (started) {
        const verb = ongoing ? '正在直播中' : '开播啦';
        return `${name}${verb}！直播链接: ${status.url}`;
    }
    const duration = status.live_duration ? `\n总直播时长：${status.live_duration}` : '';
    return `${name}下播了${duration}`;
}
function formatListItem(status, index) {
    const state = status.error ? '检测失败' : status.is_live ? '直播中' : '未开播';
    const error = status.error ? `：${status.error}` : '';
    return `${index + 1}. ${status.display_name || status.url} ${state}${error}`;
}
function apply(ctx, config) {
    const previous = new Map();
    const lastNotified = new Map();
    const liveStartedAt = new Map();
    const imageUrlCache = new Map();
    let checking = false;
    function requestOptions() {
        const token = config.apiToken?.trim();
        return {
            timeout: config.requestTimeout * 1000,
            headers: token ? { 'X-API-Token': token } : undefined,
        };
    }
    function requestRoomPayload(room) {
        return {
            platform: normalizePlatform(room.platform),
            name: room.name || '',
            url: room.url,
        };
    }
    async function requestStatus(room) {
        return await ctx.http.post(`${trimSlash(config.endpoint)}/api/check`, requestRoomPayload(room), requestOptions());
    }
    async function requestStatuses(rooms) {
        if (!rooms.length)
            return [];
        const response = await ctx.http.post(`${trimSlash(config.endpoint)}/api/check/batch`, {
            rooms: rooms.map(requestRoomPayload),
        }, requestOptions());
        return response.rooms || [];
    }
    async function notify(room, status, started, mentionAll = false, ongoing = false) {
        const channels = expandBroadcastChannels(ctx, effectiveRoomChannels(room));
        if (!channels.length) {
            ctx.logger('live-monitor').debug(`直播间 ${room.url} 未绑定通知频道，跳过自动推送。`);
            return;
        }
        const message = formatNotification(status, started, ongoing);
        const shouldMentionAll = started && mentionAll && room.mentionAllOnStart === true;
        const mentionPrefix = shouldMentionAll ? [(0, koishi_1.h)('at', { type: 'all' }), koishi_1.h.text('\n')] : [];
        if (config.notificationStyle === '纯文字') {
            await sendToChannels(ctx, channels, shouldMentionAll ? [...mentionPrefix, koishi_1.h.text(message)] : message);
            return;
        }
        const image = await renderLiveCard(ctx, status, started);
        if (image) {
            const content = [...mentionPrefix, koishi_1.h.image(image, 'image/png'), koishi_1.h.text(message)];
            await sendToChannels(ctx, channels, content);
            return;
        }
        await sendToChannels(ctx, channels, shouldMentionAll ? [...mentionPrefix, koishi_1.h.text(message)] : message);
    }
    async function applyStatusTransition(room, status) {
        const key = roomKey(room);
        const oldState = previous.get(key);
        if (status.error) {
            ctx.logger('live-monitor').warn(`检测失败，保留直播间 ${room.url} 的上一次状态且不触发开/关播变化：${status.error}`);
            return;
        }
        previous.set(key, status.is_live);
        if (status.is_live) {
            if (status.cover_url || status.avatar_url) {
                imageUrlCache.set(key, { cover_url: status.cover_url, avatar_url: status.avatar_url });
            }
        }
        else {
            const cached = imageUrlCache.get(key);
            if (cached) {
                if (!status.cover_url && cached.cover_url)
                    status.cover_url = cached.cover_url;
                if (!status.avatar_url && cached.avatar_url)
                    status.avatar_url = cached.avatar_url;
            }
        }
        const now = Date.now();
        if (status.is_live && !liveStartedAt.has(key)) {
            const startedAt = status.detected_started_at
                ? new Date(status.detected_started_at).getTime()
                : now;
            liveStartedAt.set(key, startedAt);
        }
        const lastTime = lastNotified.get(key) || 0;
        const shouldRemind = config.liveReminderInterval > 0 &&
            status.is_live &&
            lastTime > 0 &&
            (now - lastTime) >= config.liveReminderInterval * 60 * 1000;
        const getEnrichedStatus = () => {
            const startedAt = liveStartedAt.get(key);
            if (!startedAt)
                return status;
            const seconds = Math.floor((now - startedAt) / 1000);
            return {
                ...status,
                live_duration: formatDurationSeconds(seconds),
            };
        };
        if (oldState === undefined) {
            if (status.is_live) {
                if (config.notifyOnFirstLive) {
                    await notify(room, getEnrichedStatus(), true);
                    lastNotified.set(key, now);
                }
                else {
                    lastNotified.set(key, now);
                }
            }
        }
        else if (!oldState && status.is_live) {
            if (config.notifyOnStart) {
                await notify(room, getEnrichedStatus(), true, true);
            }
            lastNotified.set(key, now);
        }
        else if (oldState && !status.is_live) {
            if (config.notifyOnEnd) {
                await notify(room, getEnrichedStatus(), false);
            }
            liveStartedAt.delete(key);
            lastNotified.delete(key);
            imageUrlCache.delete(key);
        }
        else if (status.is_live && shouldRemind) {
            await notify(room, getEnrichedStatus(), true, false, true);
            lastNotified.set(key, now);
        }
    }
    async function checkRoom(room, manual = false) {
        if (room.enabled === false)
            return;
        try {
            const status = await requestStatus(room);
            if (!manual)
                await applyStatusTransition(room, status);
            return status;
        }
        catch (error) {
            ctx.logger('live-monitor').warn(`检测失败：${room.url} ${error}`);
        }
    }
    async function checkRooms(rooms, manual = false) {
        try {
            const results = await requestStatuses(rooms);
            if (!manual) {
                await Promise.all(results.map(status => {
                    const room = rooms.find(r => r.url === status.url);
                    if (room) {
                        return applyStatusTransition(room, status);
                    }
                }));
            }
            return results.filter((status) => !!status);
        }
        catch (error) {
            ctx.logger('live-monitor').warn(`批量检测失败：${error}`);
            const err = error;
            if (!err.response || err.response.status === 401 || err.response.status === 403) {
                return [];
            }
            const results = [];
            for (const room of rooms) {
                const status = await checkRoom(room, manual);
                if (status)
                    results.push(status);
            }
            return results;
        }
    }
    function getAllEnabledRooms() {
        return (config.rooms || [])
            .filter(room => room.enabled !== false && room.url);
    }
    function getEnabledRooms(session) {
        return getAllEnabledRooms()
            .filter(room => roomVisibleInSession(room, session));
    }
    function cleanupStaleMaps() {
        const activeKeys = new Set(getAllEnabledRooms().map(room => roomKey(room)));
        for (const key of previous.keys()) {
            if (!activeKeys.has(key))
                previous.delete(key);
        }
        for (const key of lastNotified.keys()) {
            if (!activeKeys.has(key))
                lastNotified.delete(key);
        }
        for (const key of liveStartedAt.keys()) {
            if (!activeKeys.has(key))
                liveStartedAt.delete(key);
        }
        for (const key of imageUrlCache.keys()) {
            if (!activeKeys.has(key))
                imageUrlCache.delete(key);
        }
    }
    async function checkAll(manual = false) {
        if (!manual && checking) {
            ctx.logger('live-monitor').warn('上一次直播状态轮询尚未完成，跳过本轮检查。');
            return [];
        }
        if (!manual)
            checking = true;
        cleanupStaleMaps();
        const rooms = getAllEnabledRooms();
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
    ctx.command('live-monitor.list', '查看全部直播间状态列表', { authority: 5 })
        .action(async () => {
        const rooms = getAllEnabledRooms();
        if (!rooms.length)
            return '没有启用的直播监控项。';
        const statuses = await checkRooms(rooms, true);
        if (!statuses.length)
            return '没有启用的直播监控项，或后端暂时不可用。';
        return statuses.map(formatListItem).join('\n');
    });
    ctx.command('live-monitor.status', '发送本群当前开播直播间卡片')
        .alias('直播状态')
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
                await session.send(formatNotification(status, true, true));
                continue;
            }
            const image = await renderLiveCard(ctx, status, true);
            if (image) {
                await session.send([koishi_1.h.image(image, 'image/png'), koishi_1.h.text(formatNotification(status, true, true))]);
            }
            else {
                await session.send(formatNotification(status, true, true));
            }
        }
    });
}
