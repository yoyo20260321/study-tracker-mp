# 蜂学 · 微信小程序 V0

study.growclaw.top 的微信小程序版, 复用同一份后端 API。

## 快速开始 (10 分钟跑起来)

### 1. 装微信开发者工具 (Mac)

下载: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

按你电脑芯片选:
- Apple M1/M2/M3 → **macOS Silicon**
- Intel → **macOS x64**

### 2. 打开本项目

1. 打开微信开发者工具
2. 点 **「+」 → 「导入项目」**
3. 选目录: `products/study-tracker-mp/`
4. AppID 已填 `wx22812ff96d1c28f2` (自动读取)
5. 项目名随便填 (如 "蜂学")
6. 后端服务: **不使用云服务**

### 3. 工具里看 + 真机调试

- **电脑模拟器**: 左侧选 "iPhone 13 Pro Max", 直接看 UI + 完整功能
- **iOS 真机**: 工具顶部点 **「真机调试」** → 出二维码 → 用 LinLang 微信扫码 → iPhone 上完整体验

> ⚠️ **重要**: `project.private.config.json` 里 `urlCheck=false`, 这样真机调试模式下可调没备案的 `study.growclaw.top` 后端。一旦 ICP 备案下来, 切 `apiBase` 到备案域名即可。

## 项目结构

```
products/study-tracker-mp/
├── app.js                 - 全局: token / user 状态
├── app.json               - 页面路由 + tabBar
├── app.wxss               - 全局样式 (蜂蜜黄 + 莫兰迪绿)
├── project.config.json    - AppID + 编译配置 (进 git)
├── project.private.config.json - 本地配置 (urlCheck=false, 不进 git)
├── utils/api.js           - 后端 API 封装 (复用 study.growclaw.top)
├── images/                - tabBar 图标占位 (待设计师替换)
└── pages/
    ├── login/             - 手机号 + 验证码登录 (复用 H5 backend)
    ├── home/              - 首页: Lv/XP/streak + 拍卷按钮 + 弱点 + 曲线
    ├── shoot/             - 拍卷选择 (相机 / 相册)
    ├── confirm/           - 提交确认
    ├── loading/           - 诊断中 (轮询 status)
    ├── report/            - 报告 (环形 + 弱点卡 + 关卡任务 + 真心话)
    ├── history/           - 报告列表
    ├── me/                - 个人 (头像 + Lv + 数据格 + 充值入口)
    └── pay/               - 套餐选择 (5次/月卡/年卡, V0 假支付)
```

## 已知限制 (V0)

| 限制 | 解决时间点 |
|---|---|
| Lv / XP / streak / 剩余次数 全是前端 mock | 等后端加 `/api/auth/me/stats` 接口 |
| 支付走假流程 (跳"功能开发中") | 等 ICP + 微信支付商户号 |
| tabBar 图标是 81x81 透明占位 | 等设计师出图 |
| 任何外网域名调用 ICP 备案前在真机/体验版会失败 | 等 ICP 备案完成 (杨道利在办) |
| 追问老师 / 邀请有礼 / 我的徽章 仅占位 | V1 |

## 上线检查清单

- [ ] ICP 域名备案完成
- [ ] 后端从 study.growclaw.top 迁到备案域名 (改 `app.js` 的 apiBase)
- [ ] 王总在 mp.weixin.qq.com 配 "服务器域名" 白名单 (request 合法域名)
- [ ] 设计师替换 `images/` 下 6 张 tabBar 图标
- [ ] 第一次提审材料 (logo / 简介 / 隐私协议)
- [ ] 跑 `miniprogram-ci upload` 推体验版
- [ ] 王总后台点"提交审核"
- [ ] 审过点"发布"

## 后端依赖

复用 `products/study-tracker` 的所有 `/api/*` 接口, 无新增。
小程序登录走 `POST /api/auth/login` (手机号 + 验证码 000000), 不用 wx.login。
