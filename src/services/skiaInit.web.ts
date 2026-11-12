// web 端使用 Skia 直接 API 前，需先加载 CanvasKit(wasm)
import { Skia } from '@shopify/react-native-skia';

let ready: Promise<void> | null = null;

export function ensureSkia(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const web = require('@shopify/react-native-skia/lib/module/web');
      const LoadSkiaWeb = web.LoadSkiaWeb || web.default;
      await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
      (window as any).__skiaInfo = {
        Image: typeof (Skia as any).Image,
        Surface: typeof (Skia as any).Surface,
        Data: typeof (Skia as any).Data,
      };
    })();
  }
  return ready;
}
