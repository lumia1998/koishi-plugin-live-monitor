# koishi-plugin-live-monitor

[![npm](https://img.shields.io/npm/v/koishi-plugin-live-monitor.svg)](https://www.npmjs.com/package/koishi-plugin-live-monitor)

一个用于检测和推送多平台主播直播状态的 Koishi 插件。它通过与配套的 Python 后端服务协同工作，支持卡片式开播提醒、关播推送、并支持周期性重复提醒。

## 🌟 核心特性
- **支持超多平台**：支持抖音、B站、快手、虎牙、斗鱼、微博、小红书、TikTok、YouTube、Twitch 等数十个海内外直播平台。
- **卡片式提醒**：在支持 Puppeteer 的环境下，可生成开播提醒卡片，并在同一条消息中附带直播地址；卡片会优先展示直播封面、主播头像、标题、人气、分区、点赞和直播时长，没有封面时会使用平台占位图，也可切换为纯文字通知。
- **去中心化配置**：主播列表完全在 Koishi 插件端配置，无需登录服务器修改后端配置文件。
- **周期重复推送**：支持正在直播的主播每隔半小时（或自定义时长）重复提醒一次，防止错过精彩瞬间。
- **按群提醒策略**：每个监控项可单独绑定频道，并可选择真实开播时是否 @全体成员。
- **高性能轮询**：优先调用后端批量检测接口获取所有主播状态，避免多主播轮询时接口排队阻塞。
- **直播数据统计**：记录每场直播并生成日、周、月统计图和月度直播打卡日历；折线图纵轴会按最长单日直播时长自动采用四等分刻度。
- **主播头像缓存**：检测到主播开播时将头像缓存到 Koishi 的 `data/live-monitor/avatars` 目录，统计图片优先读取本地缓存，仅在头像 URL 变化时下载替换。

---

## 🛠️ 第一步：部署后端服务 (必须)

该插件必须配合 **Live-Monitor** 后端 API 运行。请先部署后端服务：

- **后端 GitHub 仓库**：[Live-Monitor](https://github.com/lumia1998/Live-Monitor)

### 使用 Docker Compose 部署 (推荐)
在您的服务器目录中创建一个 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  live-monitor:
    image: ghcr.io/lumia1998/live-monitor:latest
    container_name: live-monitor
    environment:
      - TERM=xterm-256color
      - TZ=Asia/Shanghai
    ports:
      - "8000:8000"
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
    restart: unless-stopped
```

然后运行以下命令启动服务：
```bash
docker compose up -d
```
启动后，后端将运行在 `http://<服务器IP>:8000`。

---

## 🔌 第二步：安装并配置插件

### 1. 安装插件
在您的 Koishi 项目目录中运行：
```bash
npm install koishi-plugin-live-monitor
```
或者直接在 Koishi 的 **插件市场** 中搜索 `live-monitor` 并一键安装。

### 2. 配置选项
安装并启用插件后，在控制台的配置界面进行如下配置：
- **`endpoint`**：Live Monitor 后端 API 地址（例如 `http://127.0.0.1:8000`）。
- **`apiToken`**：Live Monitor 后端 API 访问令牌。如果后端 `config/config.ini` 中填写了 `API访问令牌`，这里必须填写同一个值；未设置后端令牌时留空即可。
- **`pollInterval`**：监控轮询检测间隔（单位：秒，默认 300 秒/5分钟，最小支持 30 秒）。
- **`liveReminderInterval`**：正在直播中的主播重复推送提醒间隔（单位：分钟，默认 30 分钟提醒一次；设为 0 表示仅开播推送）。
- **`notificationStyle`**：通知样式。选择“图片卡片”时会在同一条消息里发送卡片图片，并在图片外附带直播地址；卡片内不显示直播地址，后端返回封面、头像、人气、分区、点赞或直播时长时会自动展示；选择“纯文字”时只发送文字通知。
- **`notifyOnStart`**：检测到开播时推送，默认开启。
- **`notifyOnEnd`**：检测到下播时推送，默认开启；需要插件此前检测并记录过该主播开播。检测异常只会保留上一次状态，不会自动按下播处理。
- **`offlineConfirmations`**：连续检测到未开播多少次后确认下播（默认 2 次），用于避免抖音等平台的瞬时状态误判切断一场直播。
- **`rooms` (关注主播列表)**：
  - **直播间地址 (url)**：直播间的完整 URL（如 `https://live.bilibili.com/320`）。
  - **平台 (platform)**：选“自动识别”即可，后端会根据 URL 自动判定平台。
  - **主播展示名 (name)**：可选填，自定义推送卡片上显示的主播名字。
  - **绑定频道 (channels)**：可选填，只向特定群或频道推送（支持用逗号分隔多个频道）；留空时不会自动推送，但仍可通过命令查看。
  - **开播时 @全体成员 (mentionAllOnStart)**：开启后，该行监控项只有在检测到“未开播 → 开播”的真实状态变化时才会 @全体成员。插件启动后首次检测到已开播、周期重复提醒和手动查询都不会 @全体。若同一主播要在不同群使用不同策略，可以配置成多行并分别绑定频道。

### 3. 直播时长持久化

Koishi 已启用数据库服务时，插件会自动创建 `liveMonitorState` 和 `liveMonitorSession` 表。前者保存当前直播状态，插件热重载或 Koishi 重启后仍能继续累计本场时长；后者保存每场直播的起止时间、时长、标题、头像、峰值人气和点赞等统计数据。跨越午夜的直播会按自然日拆分时长，正确计入每天的打卡和折线图。

未启用数据库服务时，插件会继续使用内存状态并在日志中提示；这种模式兼容原有部署，但插件重启后本场直播会重新计时。建议需要准确统计直播时长的部署启用 Koishi 数据库服务。

---

## 🎮 机器人指令

插件注册了以下控制台与聊天命令：

*   **`live-monitor.status` / `直播状态`**：在当前群/频道手动发送可见的正在直播主播卡片。
*   **`live-monitor.calendar [主播名]` / `直播打卡 [主播名]`**：生成主播本月直播打卡日历，日期颜色按当天直播时长分级。
*   **`live-monitor.stats [主播名]` / `直播统计 [主播名]`**：生成今日、本周、本月时长与开播次数总览，以及本月逐日直播时长折线图。
*   **`日直播统计 [主播名]`、`周直播统计 [主播名]`、`月直播统计 [主播名]`**：生成对应周期的详细统计图。
*   **`live-monitor.list`**：权限等级 5 可用，忽略群/频道绑定，查看全部启用主播的纯文字开播状态列表。

统计和打卡命令需要 Koishi 数据库与 Puppeteer 服务。未指定主播名且存在多个监控项时，机器人会提示选择主播。

---

## 🔗 相关项目

*   **插件 GitHub 仓库**：[koishi-plugin-live-monitor](https://github.com/lumia1998/koishi-plugin-live-monitor)
*   **配套后端 GitHub 仓库**：[Live-Monitor](https://github.com/lumia1998/Live-Monitor)

如果您在使用中遇到问题，欢迎前往仓库提出 Issue 或贡献 PR！
