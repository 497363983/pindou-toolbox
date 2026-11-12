import { registerRootComponent } from 'expo';

// 原生入口：Skia 由系统提供，无需 CanvasKit
function start() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const App = require('./App').default;
  registerRootComponent(App);
}

start();
