# 景区导览服务 AI 数字人 Demo

这是一个纯前端景区 AI 数字人导览 Demo，使用 Vue 3 + Vite + TypeScript 实现。项目现在没有 Express mock-server，也没有数据处理脚本；所有业务数据和可配置项都固定放在 `data/*.json` 中，前端通过 `src/api/` 里的 axios API 逐个读取。

适合用来做比赛演示、前端交互原型、数字人导览 UI 魔改。

## 快速运行

环境要求：

- Node.js 20+
- npm 10+

安装并启动：

```bash
npm install
npm run dev
```

访问：

- 游客端：http://localhost:5173/
- 管理端：http://localhost:5173/admin/dashboard
- 数字人配置：http://localhost:5173/admin/avatar

构建：

```bash
npm run build
npm run preview
```

构建时 Vite 会把根目录 `data/` 复制到 `dist/data/`，所以预览和部署后仍然能通过 `/data/*.json` 读取数据。

## 现在的数据流

```text
页面组件
  -> src/stores/useGuideStore.ts
  -> src/api/index.ts
  -> src/api/http.ts
  -> /data/*.json
```

没有后端接口了。以前的 `/api/...` 已经替换为静态 JSON：

- `/data/spots.json`
- `/data/dashboard.json`
- `/data/routes.json`
- `/data/avatar-config.json`
- `/data/ai-config.json`
- `/data/tts-config.json`

需要保存的管理端配置会写入浏览器 `localStorage`，刷新页面仍然保留；换浏览器或清缓存后，会重新读取 `data/*.json` 默认值。

## 目录说明

```text
scenic-ai-guide-demo/
  data/                         # 全部业务数据和可配置 JSON
    spots.json                  # 景点知识库，来自示范景区公开资料包
    dashboard.json              # 管理端看板数据
    routes.json                 # 路线推荐数据
    avatar-config.json          # 数字人、Live2D、语音默认配置
    ai-config.json              # AI 配置默认值，目前本地 JSON 问答优先
    tts-config.json             # GPT-SoVITS V2ProPlus zero-shot 配置
  src/
    api/
      index.ts                  # 前端 API 总入口，统一读取 data/*.json
      http.ts                   # 官方 axios 实例和 get/post 封装
      storage.ts                # localStorage 读写封装
      tts.ts                    # GPT-SoVITS 请求封装
    stores/useGuideStore.ts     # Pinia 状态，负责问答、路线、数字人、TTS 状态
    features/guideTts.ts        # 浏览器语音、音频播放、Live2D 口型同步
    components/
      Live2DAvatar.vue          # Live2D 模型加载和口型参数驱动
      AvatarGuide.vue           # 数字人外壳，Live2D 失败时显示 fallback 形象
      FloatingAvatar.vue        # 游客端右下角悬浮窗
      EChart.vue                # ECharts 包装组件
      MetricCard.vue            # 管理端指标卡
    views/
      user/                     # 游客端页面
      admin-pro/                # 当前使用的管理端页面
    styles/
      theme.css                 # 拟态风主题变量和全局组件风格
    router.ts                   # 前端路由
    types.ts                    # 全局 TypeScript 类型
  vite.config.ts                # Vite 配置，同时负责开发/构建时暴露 data/
```

## 想魔改先看哪里

- 改景点知识：`data/spots.json`
- 改运营看板：`data/dashboard.json`
- 改路线推荐：`data/routes.json`
- 改数字人默认配置：`data/avatar-config.json`
- 改 TTS/GPT-SoVITS 默认配置：`data/tts-config.json`
- 改问答匹配规则：`src/api/index.ts`
- 改页面状态和语音触发：`src/stores/useGuideStore.ts`
- 改 GPT-SoVITS 调用参数：`src/api/tts.ts`
- 改游客端界面：`src/views/user/`
- 改管理端界面：`src/views/admin-pro/`
- 改拟态风视觉：`src/styles/theme.css`

## API 封装怎么用

所有数据读取都在 `src/api/`：

```ts
api.getSpots()
api.getDashboard()
api.recommendRoutes('历史文化')
api.chat({ text: '灵山大佛有什么文化意义？', interest: '历史文化' })
api.getAvatar()
api.saveAvatar(config)
api.getTTSConfig()
api.saveTTSConfig(config)
```

其中：

- `getSpots/getDashboard/getAvatar/getTTSConfig` 会 axios 读取对应 JSON。
- `chat` 不再请求后端，而是在前端根据 `spots.json` 和 `routes.json` 做本地检索并生成演示回答。
- `saveAvatar/saveTTSConfig/saveAIConfig` 写入 `localStorage`，不修改 JSON 文件本身。

`src/api/http.ts` 是官方 axios 的统一实例，暴露 `apiGet` 和 `apiPost`。以后接真实后端时，可以在这里统一配置：

```ts
export const http = axios.create({
  baseURL: 'https://your-api.example.com',
  timeout: 30000
})
```

这也是现在把获取数据方式集中进 `src/api/` 的原因：以后接真实后端时，优先改 `src/api/index.ts` 的 URL 和 `src/api/http.ts` 的请求实现。

## 数据来源

当前 `data/spots.json` 和 `data/dashboard.json` 已经整理自你提供的示范景区公开资料包：

```text
/Users/mac/Downloads/示范景区公开资料包
```

项目不再保留 docx/xlsx 处理脚本。如果以后要换资料，直接把整理后的结果写入：

```text
data/spots.json
data/dashboard.json
```

这样其他人拿到项目后不需要本地资料包，也不需要跑数据转换。

## Live2D 数字人

Live2D 默认使用 [luckui/ai-live2d-go](https://github.com/luckui/ai-live2d-go) 的 Hiyori 模型，通过 jsDelivr 加载。

关键配置在：

```text
data/avatar-config.json
```

默认加载顺序：

```text
live2dcubismcore.js
pixi.js
pixi-live2d-display/dist/cubism4.min.js
hiyori_pro_t11.model3.json
```

Hiyori 是 Cubism 4 模型，所以 runtime 要用：

```text
https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js
```

如果 CDN 访问失败，界面会自动回退到内置 2D fallback 数字人。

## GPT-SoVITS V2ProPlus Zero-Shot TTS

默认不开启本地 TTS：

```json
{
  "enabled": false
}
```

这时项目直接使用浏览器内置中文语音，方便演示。

如果你要接 GPT-SoVITS V2ProPlus zero-shot，改：

```text
data/tts-config.json
```

需要配置这些字段：

```json
{
  "enabled": true,
  "provider": "gpt-sovits-v2-pro-plus",
  "baseUrl": "http://localhost:9880",
  "apiPath": "/tts",
  "language": "zh",
  "gptSoVits": {
    "textLang": "zh",
    "promptLang": "zh",
    "refAudioPath": "/absolute/path/to/reference.wav",
    "promptText": "这里填写参考音频里一字不差的文字。",
    "mediaType": "wav",
    "textSplitMethod": "cut5"
  }
}
```

你需要自己准备：

- GPT-SoVITS V2ProPlus 服务
- 一个 3-10 秒参考音频，推荐 wav
- `promptText`，必须和参考音频内容尽量一字不差
- ffmpeg

macOS 安装 ffmpeg：

```bash
brew install ffmpeg
```

Windows 到 [FFmpeg 官网](https://ffmpeg.org/download.html) 下载，并把 `ffmpeg` 加到系统 `PATH`。

注意：现在没有后端代理，浏览器会直接请求：

```text
POST ${baseUrl}${apiPath}
```

所以 GPT-SoVITS 服务需要允许浏览器跨域请求。如果遇到 CORS 报错，需要在 GPT-SoVITS 服务侧允许 `http://localhost:5173`，或者你后续自己加一个很薄的代理服务。

`refAudioPath` 也要填 GPT-SoVITS 服务能访问到的路径。最稳妥是填绝对路径。

## 已删除的旧东西

这些都不再需要：

- `mock-server/`：Express mock API
- `scripts/prepare-data.mjs`：docx/xlsx 数据处理脚本
- `scripts/load-env.mjs`：后端环境变量加载脚本
- `source-data/`：原始资料包占位目录
- `.env.example`：后端时代的环境变量示例
- 旧版 `src/views/admin/`
- 旧版 `src/views/VisitorGuide.vue`

现在项目只需要：

```bash
npm install
npm run dev
```

## 常见问题

### 为什么没有 `npm run dev:all`

因为已经没有后端了，只需要：

```bash
npm run dev
```

### 为什么 JSON 改了页面没变化

管理端保存过的配置会优先读 `localStorage`。如果你想重新使用 `data/*.json` 默认值，清理浏览器 localStorage 即可。

### 为什么 TTS 没声音

先保持 `data/tts-config.json` 里的 `enabled=false`，确认浏览器语音正常。再打开 GPT-SoVITS，并确认：

- `baseUrl` 正确
- `apiPath` 是 `/tts`
- `refAudioPath` 是 GPT-SoVITS 能访问的路径
- `promptText` 和参考音频内容对应
- GPT-SoVITS 服务允许浏览器跨域访问

### 为什么 Live2D 不显示

优先看浏览器控制台。如果是 CDN 访问失败，可以把 Live2D 资源下载到本地，再改 `data/avatar-config.json` 里的 `assetBase/modelUrl/coreUrl`。
