# Implementation Plan - Integrating aria2 Engine

This plan outlines the steps to integrate the aria2 download engine into Nexus Mirror via JSON-RPC.

## 1. Core Logic (Main Process)
- **Aria2Manager**: A class to spawn the `aria2c.exe` process with specific arguments (RPC enabled, secret token, port).
- **Aria2RPC**: A module to handle JSON-RPC calls over HTTP/WebSocket.
- **IPC Handlers**: Setup listeners in `main/index.ts` for actions like `add-url`, `get-tasks`, `pause-task`, etc.

## 2. Bridge (Preload)
- Expose a `window.aria2` object to the renderer containing methods to interact with the download engine.

## 3. UI Integration (Renderer)
- **Task Polling**: Implement a hook or service in React to poll aria2 for active/waiting/stopped tasks.
- **Add Task Dialog**: Connect the "New Download" button to an IPC call.
- **Reactive UI**: Map aria2 status (GID, progress, speed) to the `mockDownloads` structure in `App.tsx`.

## 4. Binary Management
- Expect `aria2c.exe` in `resources/bin/`.
- Fallback/Error handling if the binary is missing.

## 5. Persistence
- Ensure `aria2.session` is used to save progress across app restarts.
