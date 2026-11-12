import { registerRootComponent } from 'expo';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

function start() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const App = require('./App').default;
  registerRootComponent(App);
}

// web 端必须在导入 App（触发 Skia 初始化）之前加载本地 CanvasKit
LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(start);
