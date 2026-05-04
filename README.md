# 景区导览服务 AI 数字人 Demo

第十五届中国软件杯 A5 赛题演示项目。项目包含游客交互端与管理后台，使用 Vue 3 + Vite + TypeScript + Express Mock API 实现。

## 功能

- 游客端：文本问答、浏览器语音输入、语音播报、2D 数字人口型与表情动效、个性化路线推荐。
- 管理后台：知识库管理、数字人形象配置、游客感受度报告、运营数据大屏。
- 数据准备：可从项目内相对目录 `source-data/` 读取公开资料包，也可以直接使用仓库自带的 `data/` 样例数据。

## 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本

## 快速运行

在项目根目录执行：

```bash
npm install
npm run prepare:data
npm run dev:all
```

访问：

- 游客端：http://localhost:5173/
- 管理后台：http://localhost:5173/admin/dashboard
- Mock API：http://localhost:8787/api/knowledge/spots

`npm run dev:all` 会同时启动：

- `npm run server`：Mock API，默认端口 `8787`
- `npm run dev`：Vite 前端，默认端口 `5173`

## 数据资料包

项目默认会从相对目录 `source-data/` 读取原始资料包：

```text
scenic-ai-guide-demo/
  source-data/
    灵山胜境 景点结构化数据集.docx
    景点景区旅游数据行为分析数据.xlsx
```

如果没有原始资料包，`npm run prepare:data` 会保留仓库自带的 `data/spots.json` 和 `data/dashboard.json`，所以项目仍然可以直接启动演示。

如需指定其他资料包目录，可以传入相对路径或绝对路径：

```bash
DATA_PACK_DIR=./source-data npm run prepare:data
```

Windows PowerShell：

```powershell
$env:DATA_PACK_DIR = ".\source-data"
npm run prepare:data
```

Windows CMD：

```bat
set DATA_PACK_DIR=.\source-data
npm run prepare:data
```

## 可选配置

可复制 `.env.example` 为 `.env` 后按需修改，默认值已经能直接跑起来。

```bash
cp .env.example .env
```

常用配置：

- `PORT`：Mock API 端口，默认 `8787`
- `HOST`：Mock API 监听地址，默认 `localhost`
- `API_HOST` / `API_PORT`：Vite 开发代理目标，默认指向 `localhost:8787`
- `WEB_HOST` / `WEB_PORT`：Vite 前端监听地址和端口，默认 `localhost:5173`
- `PREVIEW_PORT`：`npm run preview` 的端口，默认 `4173`
- `DATA_PACK_DIR`：原始资料包目录，默认 `./source-data`
- `TTS_ENABLED`：是否启用本地 TTS，默认 `false`
- `TTS_URL`：本地 TTS 服务地址，默认 `http://localhost:9880`，只有 `TTS_ENABLED=true` 时才会请求
- `VITE_LIVE2D_ASSET_BASE`：Live2D 静态资源根地址，默认使用 `luckui/ai-live2d-go` 的 jsDelivr CDN
- `VITE_LIVE2D_MODEL_URL`：可选，覆盖 Live2D 模型 `.model3.json` 地址
- `VITE_LIVE2D_CORE_URL`：可选，覆盖 Cubism Core 脚本地址

## 数字人现在怎么工作

当前版本不依赖真实大模型 Key。问答逻辑采用本地知识库检索 + Mock RAG 生成，`mock-server/server.mjs` 中保留 `modelProvider` 字段，后续可替换为真实多模态大模型、TTS、ASR 或数字人 SDK。

Live2D 数字人来自 [luckui/ai-live2d-go](https://github.com/luckui/ai-live2d-go) 的 Hiyori 模型。本项目只集成 Web 悬浮窗需要的 Live2D 渲染、动作触发和口型同步，没有引入原仓库里的 Electron 桌面端、SQLite、Discord、STT 服务、MCP/工具调用等无关模块。

这次修复的关键点是：Hiyori 是 Cubism 4 的 `.model3.json` 模型，浏览器端需要按顺序加载 `live2dcubismcore.js`、`pixi.js`、`pixi-live2d-display/dist/cubism4.min.js`。如果使用通用的 `index.min.js` 或 Core 没有先加载，`PIXI.live2d.Live2DModel` 不会正确注册，界面就会只显示 fallback 形象。

管理端入口：

```text
http://localhost:5173/admin/avatar
```

在“数字人配置”里可以直接改：

- 是否启用 Live2D
- 资源根地址 `assetBase`
- 模型文件 `modelUrl`
- Cubism Core 脚本 `coreUrl`
- Pixi 脚本 `pixiUrl`
- Pixi Live2D Cubism4 运行时 `runtimeUrl`
- 是否启用本地 TTS、TTS 地址、音色、语言

默认情况下不需要配置 TTS。项目会直接使用浏览器内置中文语音播报；只有你在管理端打开“本地 TTS（可选）”或把 `.env` 里的 `TTS_ENABLED=true` 打开时，才会请求本地 TTS 服务。

代码对应关系：

```text
src/components/Live2DAvatar.vue        # 加载 Cubism Core、Pixi、Live2D runtime，并挂载模型
src/components/AvatarGuide.vue         # 数字人外壳，Live2D 失败时回退到内置 2D 形象
src/components/FloatingAvatar.vue      # 游客端右下角悬浮窗
src/views/admin-pro/AvatarConfigView.vue # 管理端数字人、Live2D、TTS 配置页面
src/stores/useGuideStore.ts            # 前端状态，保存数字人和 TTS 配置
src/features/guideTts.ts               # 浏览器语音、本地 TTS、Live2D 口型同步
mock-server/server.mjs                 # Mock API，保存配置并代理本地 TTS
```

## Live2D 本地化

默认配置不需要下载 Live2D 资源，会从 jsDelivr 读取 `luckui/ai-live2d-go` 的 Hiyori 模型。如果想完全离线运行，可以把 `ai-live2d-go` 的 `public/Core/` 和 `public/Resources/Hiyori_pro/` 复制到本项目的 `public/live2d/` 下，最终目录应该长这样：

```text
scenic-ai-guide-demo/
  public/
    live2d/
      Core/
        live2dcubismcore.js
      Resources/
        Hiyori_pro/
          hiyori_pro_t11.model3.json
          ...
```

复制后可以在管理端填写这些值，也可以写进 `.env`：

```bash
VITE_LIVE2D_ASSET_BASE=/live2d
VITE_LIVE2D_MODEL_URL=/live2d/Resources/Hiyori_pro/hiyori_pro_t11.model3.json
VITE_LIVE2D_CORE_URL=/live2d/Core/live2dcubismcore.js
```

如果不想填完整地址，`modelUrl` 和 `coreUrl` 也可以写相对路径：

```text
Resources/Hiyori_pro/hiyori_pro_t11.model3.json
Core/live2dcubismcore.js
```

它们会自动拼到 `assetBase` 后面。

## TTS 接入说明

当前项目可以直接用浏览器内置语音播报，不下载 TTS 也能演示。要接入更自然的本地 TTS，你需要自己准备一个 TTS 服务，例如 GPT-SoVITS、CosyVoice、ChatTTS、Edge-TTS 封装服务等。项目不绑定具体 TTS 产品，只要求它对外提供下面三个 HTTP 接口。

健康检查：

```http
GET /health
```

返回 `200` 表示可用。

音色列表，可选：

```http
GET /speakers
```

建议返回：

```json
{
  "speakers": [
    { "id": "xiaoxiao", "name": "晓晓" }
  ]
}
```

生成语音：

```http
POST /tts/generate
Content-Type: application/json

{
  "text": "欢迎来到灵山胜境。",
  "speaker": "xiaoxiao",
  "language": "Auto"
}
```

返回值需要是音频二进制，推荐 `audio/wav` 或 `audio/mpeg`。项目会通过 Mock API 代理到你的 TTS 服务：

```text
前端 /api/tts/generate -> mock-server -> TTS_URL/tts/generate
```

配置示例：

```bash
TTS_ENABLED=true
TTS_URL=http://localhost:9880
TTS_SPEAKER=xiaoxiao
TTS_LANGUAGE=Auto
```

也可以在管理端 `http://localhost:5173/admin/avatar` 里直接打开“本地 TTS（可选）”并填写同样的信息。Live2D 口型同步会优先使用 TTS 返回的音频波形驱动；如果本地 TTS 不可用，会自动回退到浏览器语音。

## 为什么之前没有正常启动或显示

如果只执行 `npm run dev`，只会启动 Vite 前端，不会启动 Mock API。页面访问 `/api/...` 时会没有后端响应，所以推荐直接执行：

```bash
npm run dev:all
```

如果 `npm install` 或数据准备在别人的电脑上失败，通常是因为文档或脚本里写死了本机绝对路径。现在所有运行步骤都只依赖项目内相对路径，资料包默认放在 `./source-data`，也可以用 `DATA_PACK_DIR=./source-data npm run prepare:data` 指定。

如果页面能打开但数字人模型不显示，优先检查浏览器控制台：

- 能访问外网时，默认 CDN 配置应该直接显示 Hiyori。
- 不能访问 jsDelivr 时，把 Live2D 资源放到 `public/live2d/`，再按“Live2D 本地化”填写。
- Cubism 4 模型要使用 `pixi-live2d-display@0.4.0/dist/cubism4.min.js`，不要换成 `index.min.js`。
