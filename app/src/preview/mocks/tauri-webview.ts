/**
 * Mock for `@tauri-apps/api/webview`.
 *
 * 真实实现提供 window 级文件拖拽监听等原生能力，预览模式下浏览器
 * 没有这些底层事件源，全部退化为 no-op 以避免业务代码崩溃。
 */

type UnlistenFn = () => void;

function noopListener(): UnlistenFn {
  return () => {};
}

export function getCurrentWebview() {
  return {
    async listen<T = unknown>(
      _event: string,
      _handler: (e: { payload: T }) => void,
    ): Promise<UnlistenFn> {
      return noopListener();
    },
    async onDragDropEvent(
      _handler: (e: { payload: { type: string; paths?: string[] } }) => void,
    ): Promise<UnlistenFn> {
      return noopListener();
    },
  };
}

export function getCurrent() {
  return getCurrentWebview();
}
