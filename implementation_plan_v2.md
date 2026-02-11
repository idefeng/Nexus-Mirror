# Implementation Plan - Intelligence & Enhanced UI

This plan describes the implementation of clipboard monitoring, native notifications, and improved error handling in Nexus Mirror.

## 1. Main Process (Logic & System Integration)

### 1.1 Clipboard Monitoring (`src/main/clipboard-monitor.ts`)
- **Objective**: Periodically check the system clipboard for download links.
- **Rules**:
  - Check interval: 2000ms.
  - Pattern: `.exe`, `.zip`, `.mp4`, `magnet:?xt=`.
  - Avoid duplicates: Store `lastClipboardText`.
- **Action**: When a match is found, emit an event or trigger a notification.

### 1.2 Tray & Notification Management (`src/main/tray-manager.ts`)
- **Objective**: Manage the system tray icon and native notifications.
- **Features**:
  - Initialize Tray icon.
  - `showDownloadPrompt(url)`: Show a system notification asking to download.
  - `showDownloadComplete(gid, filePath)`: Native notification with "Open Folder" action.
- **IPC**: Handle `shell:open-folder` requests.

## 2. Preload Bridge (`src/preload/index.ts`)
- **Task**: Expose `shell.showItemInFolder` and clipboard-related events to the renderer.
- **API**: `window.api.shell.openFolder(path)`, `window.api.clipboard.onDetected(callback)`.

## 3. Renderer Process (UI & UX)

### 3.1 Error Handling in Task List
- **Task**: Enhance the task card component in `App.tsx` to handle `error` status.
- **UI**: 
  - Red border/glow for tasks with `status === 'error'`.
  - "Retry" button that calls `aria2.unpause` or re-adds the URI.
  - "Show in Folder" button for `status === 'complete'`.

### 3.2 Clipboard Detection Dialog
- **Task**: When a link is detected while the app is open, show a non-intrusive toast or modal asking to import.

## 4. Dependencies
- No new external dependencies required (using Electron built-ins).

## 5. Development Steps
1. Create `ClipboardMonitor` and integrate into `main/index.ts`.
2. Implement native notifications with actions.
3. Update Preload to support folder opening.
4. Refactor `App.tsx` task card for error/complete states.
