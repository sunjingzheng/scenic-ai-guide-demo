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
- `DATA_PACK_DIR`：原始资料包目录，默认 `./source-data`
- `TTS_URL`：本地 TTS 服务地址，默认 `http://localhost:9880`

## 说明

当前版本不依赖真实大模型 Key。问答逻辑采用本地知识库检索 + Mock RAG 生成，`mock-server/server.mjs` 中保留 `modelProvider` 字段，后续可替换为真实多模态大模型、TTS、ASR 或数字人 SDK。

Live2D 运行时没有作为外部绝对路径依赖打包进仓库。未提供 Live2D 资源时，界面会自动使用项目内置 2D fallback 数字人，保证任何人克隆项目后都能按上面的步骤启动。
