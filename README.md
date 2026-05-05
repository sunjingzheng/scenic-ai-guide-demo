# 景区导览服务 AI 数字人 Demo

纯前端 Vue 3 + Vite + TypeScript 演示项目。所有景区数据、AI 配置、TTS 配置、Live2D 模型配置、微信/平台桥接配置都放在 `data/*.json`，前端通过 `src/api/` 统一读取，后续接真实后端时只需要替换这一层。

本轮已从 `/Users/mac/Projects/ai-live2d-go` 迁入可复用内容：

- Live2D Cubism Core 与 Hiyori/Hiyori Pro 模型资源：`public/live2d/`
- AI 多 Provider 配置结构：`data/ai-config.json`
- TTS 多 Provider 配置结构：`data/tts-config.json`
- 微信 iLink / Discord 桥接配置结构：`data/bridge-config.json`
- 管理端配置入口：`/admin/avatar`

管理端已统一接入 Ant Design Vue，并在现有拟态化主题变量上做了覆盖。数字人相关配置都能在 `/admin/avatar` 可视化修改，不需要打开代码文件；保存后写入浏览器 localStorage，点“恢复默认”会回到 `data/*.json` 的默认配置。

没有迁入 Electron、SQLite、STT、Discord/微信自动发送工具、浏览器自动化工具等桌面端执行代码；当前项目只负责前端展示和保存配置。真正连接微信发送消息仍需要后续后端或桌面桥接服务读取这些配置。

## 运行

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

## 目录

```text
data/
  spots.json             # 景点知识库
  dashboard.json         # 运营看板数据
  routes.json            # 路线推荐数据
  avatar-config.json     # 数字人、Live2D 本地模型资源配置
  ai-config.json         # AI 多 Provider 配置
  tts-config.json        # TTS 多 Provider 配置
  bridge-config.json     # 微信 iLink / Discord 桥接配置

public/live2d/
  Core/                  # live2dcubismcore.js
  vendor/                # 本地 Pixi 和 Cubism4 runtime，避免访问 CDN 才能显示
  Resources/Hiyori/      # Hiyori 模型
  Resources/Hiyori_pro/  # Hiyori Pro 模型

src/api/
  http.ts                # axios 实例，后续接后端主要改这里
  index.ts               # 业务 API：读 data/*.json、保存 localStorage
  tts.ts                 # GPT-SoVITS / HTTP TTS 请求封装
  storage.ts             # localStorage 读写

src/components/
  Live2DAvatar.vue       # Live2D 加载和口型驱动
  AvatarGuide.vue        # 数字人外壳和 fallback 形象
  FloatingAvatar.vue     # 游客端悬浮窗

src/views/admin-pro/
  AvatarConfigView.vue   # AI、TTS、Live2D、微信配置管理页
```

## 管理端能配置什么

进入：

```text
http://localhost:5173/admin/avatar
```

可以配置：

- 数字人外观、语音开关、语速
- Live2D 模型预设：本地 Hiyori Pro、本地 Hiyori
- Live2D 资源根地址、model3.json、Cubism Core、Pixi、Cubism4 runtime
- TTS Provider：GPT-SoVITS V2ProPlus、Edge-TTS、MOSS-TTS-Nano、通用 HTTP TTS
- GPT-SoVITS zero-shot 参考音频路径、参考文本、语言、切分方式
- AI Provider：本地 JSON、豆包、豆包 Coding Plan、Qwen 本地、OpenAI Compatible
- AI Base URL、API Key、模型、max tokens、temperature、thinking token、system prompt
- 微信 iLink：启用、Base URL、Token、Account ID、会话 ID、分片延迟
- Discord：启用、Token、代理地址

管理端保存后的配置写入浏览器 `localStorage`。如果你改了 `data/*.json` 但页面仍显示旧配置，清理浏览器 localStorage 或点管理端里的恢复默认项即可。

## AI 配置

默认配置在：

```text
data/ai-config.json
```

迁入了 `ai-live2d-go/electron/ai.config.ts` 的多 Provider 思路：

- `activeProvider`：当前启用的 provider key
- `providers`：各服务商配置
- `thinkingBudgetTokens`：推理模型 thinking token 上限
- `enabledToolsets`：保留字段，给后续 Agent/工具系统使用
- `extraParams`：保留字段，可给不同服务商透传自定义参数

当前项目仍是纯前端本地 JSON 问答，不会直接把 API Key 发给真实大模型。后续接后端时，可以让后端读取管理端保存的 AI 配置，再调用真实 LLM。

## TTS 配置

默认配置在：

```text
data/tts-config.json
```

迁入了 `ai-live2d-go/electron/tts.config.ts` 的多 Provider 思路，并保留你要的 GPT-SoVITS V2ProPlus zero-shot：

- `gpt_sovits_zero_shot`：GPT-SoVITS V2ProPlus
- `local_edge_tts`：Edge-TTS 本地服务
- `local_moss_nano`：MOSS-TTS-Nano 本地服务

浏览器会直接请求当前 provider 的：

```text
POST ${baseUrl}${apiPath}
```

所以 TTS 服务需要允许浏览器跨域访问。GPT-SoVITS zero-shot 至少要配置：

- `refAudioPath`：GPT-SoVITS 服务能访问到的参考音频路径
- `promptText`：参考音频逐字文本
- `textLang` / `promptLang`：中文一般填 `zh`
- `mediaType`：推荐 `wav`

如果 TTS 失败，项目会自动回退到浏览器内置语音。

## Live2D 模型

模型资源已复制到：

```text
public/live2d/
```

默认使用本地 Hiyori Pro：

```json
{
  "assetBase": "/live2d",
  "modelUrl": "Resources/Hiyori_pro/hiyori_pro_t11.model3.json",
  "coreUrl": "Core/live2dcubismcore.js"
}
```

Hiyori 是 Cubism 4 模型，runtime 已放到本地：

```text
/live2d/vendor/pixi.min.js
/live2d/vendor/cubism4.min.js
```

如果 Live2D 加载失败，界面会自动显示内置 2D fallback 数字人。

## 微信桥接

默认配置在：

```text
data/bridge-config.json
```

迁入自 `ai-live2d-go/electron/bridges/bridge.config.ts` 的配置字段：

- `wechat.enabled`
- `wechat.token`
- `wechat.accountId`
- `wechat.baseUrl`
- `wechat.conversationId`
- `wechat.sendChunkDelay`

当前纯前端项目不会直接调用微信 iLink，也不会保存 token 到服务器。管理端只是把配置保存在浏览器 localStorage，方便后续真实后端或桌面桥接服务读取。

## 接真实后端

后续接后端时，优先改：

```text
src/api/http.ts
src/api/index.ts
src/api/tts.ts
```

现在页面和 store 只调用 `src/api/` 暴露的方法，不直接关心数据来自 JSON、localStorage 还是真实接口。
