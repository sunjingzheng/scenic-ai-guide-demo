# 景区导览服务 AI 数字人 Demo

第十五届中国软件杯 A5 赛题演示项目。项目包含游客交互端与管理后台，使用 Vue 3 + Vite + TypeScript + Express Mock API 实现。

## 功能

- 游客端：文本问答、浏览器语音输入、语音播报、2D 数字人口型与表情动效、个性化路线推荐。
- 管理后台：知识库管理、数字人形象配置、游客感受度报告、运营数据大屏。
- 数据准备：从公开资料包抽取“灵山胜境 / 拈花湾”景点知识与游客行为统计。

## 运行

```bash
npm install
npm run prepare:data
npm run dev:all
```

访问：

- 游客端：http://localhost:5173/
- 管理后台：http://localhost:5173/admin/dashboard
- Mock API：http://localhost:8787/api/knowledge/spots

## 资料包路径

默认读取：

```text
C:\Users\sun'jing'zheng\Desktop\示范景区公开资料包
```

如需替换资料包路径：

```bash
set DATA_PACK_DIR=D:\your-data-pack
npm run prepare:data
```

## 说明

当前版本不依赖真实大模型 Key。问答逻辑采用本地知识库检索 + Mock RAG 生成，`mock-server/server.mjs` 中保留 `modelProvider` 字段，后续可替换为真实多模态大模型、TTS、ASR 或数字人 SDK。
