// 原生端 Skia 由系统提供，无需初始化
export function ensureSkia(): Promise<void> {
  return Promise.resolve();
}
