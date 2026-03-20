# 自用健身记录软件（原型）

这是根据《个人健身辅助APP开发记录》整理并实现的第一版可运行原型。

## 已实现

- 年历导入（默认 2026，可切换年份后重新导入）
- 三层时间表头：`Month -> Week -> Day`
- `Day` 旁显示周几色块，并支持开关显示/隐藏
- 一级分类（训练部位）可增删改
- 二级分类（训练动作）可增删改
- 以 `Day x 动作` 记录重量（kg）
- 每个动作行支持绘图：
  - 点线图（point + line）
  - X 轴范围：`0 ~ 最新记录天数`
  - 虚线标出 week 与 month 变化
  - 起点和终点显示 `(D/M)`
  - Y 轴范围：`0 ~ 最大记录值 + 10`
  - 字体 Arial、无网格

## 如何运行

直接在浏览器打开：

- `web/index.html`

如果浏览器限制本地模块加载，可在项目目录启动一个静态服务后访问页面。

## 文件说明

- `docs/需求拆解.md`：需求结构化说明
- `web/index.html`：页面结构
- `web/styles.css`：样式与响应式布局
- `web/app.js`：状态管理、表格生成、记录与绘图逻辑
 - PWA: 打开 `web/index.html` 并启用 Service Worker（需通过 HTTPS 或本地服务器）。
 - `web/manifest.json`：PWA 注册文件，包含图标与启动设置。
 - `web/service-worker.js`：离线缓存逻辑（基础实现，缓存页面资源）。

如何在 iPhone 上试用 PWA：
- 使用一个本地或远程 HTTPS 服务托管项目根目录（例如 `web/`），例如在项目根运行：
  ```bash
  # 在本地启动一个静态服务（Python 3）
  cd web
  python3 -m http.server 8000
  # 在本机或局域网通过 https 可用时更佳；iOS 对 Service Worker 要求 HTTPS
  ```
- 在 iPhone 的 Safari 中打开对应地址（或用 ngrok 暴露 HTTPS），打开后点击分享按钮并选择“添加到主屏”。
- 如需打包为独立 iOS App（离线分发或 TestFlight），可使用 Capacitor 或原生 WKWebView。README 中后续部分列有说明。
 - `web/fonts.css`：字体与字号集中管理（修改此文件来调整中英文字体）

---

自动部署到 GitHub Pages：

1. 我已添加一个 GitHub Actions workflow（`.github/workflows/deploy-pages.yml`），会在你把代码推到 `main` 分支时自动将 `web/` 目录内容发布到 GitHub Pages。
2. 使用方法：
  - 确保仓库在 GitHub 上且你使用的发布分支为 `main`（或按需修改 workflow）。
  - Push 到 `main`（例如 `git push origin main`）。
  - 等待 Actions 完成（在 GitHub 仓库的 Actions -> Deploy to GitHub Pages 查看运行状态）。
3. 发布后访问地址通常为： `https://<your-github-username>.github.io/<repo-name>/`。在仓库 Settings -> Pages 页面可以看到分配的 URL。
4. 备注：GitHub Pages 在中国大陆访问稳定性可能受限。如需稳定对大陆用户，请参考 README 中的“国内部署”章节（使用腾讯云 COS + CDN）。

如果你希望我把当前仓库的 `main` 分支内容直接推到 GitHub（需要你提供远程仓库权限或在本机运行脚本），我也可以生成一个便捷的 `git` 命令脚本供你执行。
