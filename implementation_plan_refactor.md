# Implementation Plan - UI/UX Refactor & Componentization

Nexus Mirror 当前的 `App.tsx` 逻辑较为臃肿（超过 700 行），将业务逻辑与 UI 代码混杂在一起。为了提升代码可维护性并实现“UI/UX Pro Max”级别的视觉效果，我们计划进行深度的组件化重构和 UI 升级。

## 1. 架构目标
- **逻辑抽离**：将 aria2 轮询、状态管理和剪贴板逻辑提取到自定义 Hook 中。
- **组件化**：将 UI 拆分为独立的、功能明确的组件。
- **视觉升级**：引入玻璃拟态 (Glassmorphism)、交错动画 (Staggered Animations) 和更具设计感的背景。

## 2. 核心组件拆分
- `layout/Sidebar.tsx`: 处理侧边栏导航和全局下载统计。
- `components/TaskCard.tsx`: 渲染单个下载任务，包括进度条、状态图标和控制按钮。
- `components/TorrentModal.tsx`: 渲染种子文件选择对话框。
- `components/SearchInput.tsx`: 渲染顶部的任务添加输入框和检测到的链接提示。
- `components/EmptyState.tsx`: 渲染空列表时的占位图和引导信息。

## 3. 性能与交互优化 (UI/UX Pro Max)
- **背景增强**：使用 `wavy-lines.svg` 配合渐变背景，创造深度感。
- **动画增强**：
  - 任务列表进入时的交错位移动画。
  - 进度条的流光动画。
  - 按钮悬停时的微互动（缩放、发光）。
- **状态感知**：不同状态（下载中、暂停、错误、完成）使用更鲜明的颜色基调。

## 4. 实施步骤
1. **创建 Hook**：编写 `src/renderer/src/hooks/useAria2.ts` 处理核心业务逻辑。
2. **定义组件库**：在 `src/renderer/src/components/` 下逐一创建子组件并迁移样式。
3. **样式重构**：优化 `main.css` 确保全局样式的一致性。
4. **重构 App.tsx**：整合所有组件，保持主文件简洁（预期 < 100 行）。

## 5. 验证点
- 确认自动识别剪贴板并弹出提示的功能依然正常。
- 确认种子预加载和选文件功能正常。
- 确认托盘通知和打开文件夹功能正常。
- 观察动画是否流畅，FPS 是否稳定。
