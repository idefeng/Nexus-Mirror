# 🌌 Nexus Mirror (灵镜里)

一款基于 Aria2 核心的高性能、全能型、极致美观的现代化下载客户端。

[![Status](https://img.shields.io/badge/Status-Released-brightgreen?style=for-the-badge)]()
[![Build](https://img.shields.io/badge/Build-v1.0.0-blue?style=for-the-badge)]()
[![Style](https://img.shields.io/badge/Style-Premium%20Glass-purple?style=for-the-badge)]()

---

## 🌟 特性亮点

*   **极致视觉 (UI/UX Pro Max)**: 基于玻璃拟态 (Glassmorphism) 的现代化 UI 设计，支持深色沉浸模式、平滑动画反馈及细致微交互。
*   **无边框设计**: 移除传统窗口框架，支持全局背景拖拽自定义窗口控制，打造一体化原生应用感。
*   **高性能核心**: 内置并自动管理 Aria2 进程，支持多协议（HTTP/HTTPS, FTP, BT, Magnet）并发下载。
*   **浏览器接管**: 开放 RPC 接口（6800 端口）及全域 CORS 支持，可无缝对接所有主流 Aria2 浏览器扩展。
*   **智能剪贴板**: 自动识别剪贴板中的链接并弹窗询问，下载快人一步。
*   **网络代理**: 支持自定义 HTTP/SOCKS5 代理，实时同步生效，打破网络地域限制。
*   **任务管理**: 完善的任务状态跟踪、即时预览（种子文件预览）及灵活的垃圾箱机制。

---

## 🛠️ 技术栈

- **Core**: Electron + Node.js
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **Engine**: Aria2 (High-performance downloader)
- **Icons**: Lucide React

---

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 构建发行版

```bash
# 构建 Windows 版本 (exe/msi)
pnpm build:win

# 构建 MacOS 版本
pnpm build:mac

# 构建 Linux 版本
pnpm build:linux
```
<img width="1080" height="720" alt="image" src="https://github.com/user-attachments/assets/f6e396eb-cdfa-40ad-b500-5b4cedc5dcf5" />

---

## 📖 用户手册

详细的使用说明请参考 [用户手册 (MANUAL.md)](./MANUAL.md)。

---

## 👨‍💻 开发者

**idefeng**
- 📧 Email: [changdefeng06@gmail.com](mailto:changdefeng06@gmail.com)
- 🐙 GitHub: [@idefeng](https://github.com/idefeng)

---

## 📄 开源协议

本项目基于 MIT 协议开源。
