# 拼豆图纸（Bead Pattern Toolbox）

把任意图片一键转换成**拼豆（拼拼豆豆 / Perler Beads）施工图纸**的跨端应用：自动网格化、取色、匹配真实厂商豆色号，输出带网格色号与用料清单的图纸，支持手动修改格点颜色。整条流水线在端上离线运行，无需联网、不上传图片。

首版面向个人自用，基于 React Native + Expo 开发，一套代码同时跑 **Android（原生 Skia）** 与 **Web（浏览器 Canvas）**。

---

## 功能特性

- **图片导入**：从相册选择 / 拍照（Web 端支持本地选择与内置示例图）。
- **网格化转换**：自定义宽高格数，支持锁定原图比例；宽高既可点 +/- 调整，也可**直接输入数字**。
- **真实豆色映射**：在 **LAB 色彩空间 + CIEDE2000 感知色差**下匹配最接近的真实豆色，输出厂商色号而非普通 RGB。
- **多种取色策略**：
  - 默认「主导色（清晰）」：取每格出现频率最高的颜色，并做**描边保留**（深色像素占比足够时直接判深色，保证头发、眼睛、轮廓线条连贯），配合饱和度/对比度/gamma 增强，避免整体发浅。
  - 「平均色（柔和）」：取格内平均色，过渡更柔和。
  - 可选「Floyd–Steinberg 抖动」：渐变与明暗更还原（默认关闭，色块更干净）。
- **多品牌色板**：内置 8 套主流品牌标准，并支持**新建 / 复制 / 编辑自定义色板**（自定义色号 + HEX）。
- **三视图输出**：效果图、图纸（带色号网格）、用料清单；默认即展示带色号与颜色清单的施工图。
- **手动改色**：点选任意格点，从色板中选色替换，用料数量实时更新。
- **导出与保存**：保存到本地作品 / 导出高清施工图纸到相册（Web 端直接下载 PNG）/ 系统分享。
- **板型与尺寸估算**：基于 5mm 豆径自动计算用板数量与成品物理尺寸。
- **中文渲染**：随包内置 Noto Sans SC 字体，保证 Android 端图纸中文标题与说明正常显示。

---

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | React Native 0.86 + Expo SDK 57 |
| 语言 | TypeScript 6 |
| UI / 状态 | React 19、React Navigation、Zustand |
| 原生图形 | @shopify/react-native-skia（Skia） |
| Web 图形 | 浏览器 Canvas 2D（react-native-web） |
| 色彩算法 | sRGB → XYZ → LAB，CIEDE2000 色差；Floyd–Steinberg 抖动 |
| 本地存储 | AsyncStorage（自定义色板 / 项目持久化） |

---

## 工作原理

转换是一条确定性的端上流水线：

```
导入图片
  → 按目标网格重采样（每格 = 1 颗豆）
  → 计算每格目标色（主导色 / 平均色，可选抖动）
  → 在 LAB + CIEDE2000 下匹配最接近的豆色号
  → 输出格点下标 + 用料统计
  → 渲染带色号网格、板边界与颜色清单的图纸
```

透明像素（alpha 低于阈值）视为空格，不参与用豆统计。

---

## 目录结构

```
.
├── App.tsx                     # 应用入口与导航（含字体/ Skia 启动门）
├── index.ts                    # 原生入口
├── index.web.ts                # Web 入口（加载 CanvasKit）
├── app.json                    # Expo 配置（包名、权限、插件）
├── eas.json                    # EAS 构建配置
├── assets/
│   └── fonts/NotoSansSC.ttf    # 内置中文字体
├── public/                     # Web 静态资源（canvaskit.wasm、示例图）
└── src/
    ├── theme.ts                # 设计系统（配色、圆角、字号）
    ├── components/
    │   ├── ui.tsx              # Card / Button / Stepper / Segmented 等通用组件
    │   ├── BeadCanvas.tsx      # 原生 Skia 图纸画布（含点选）
    │   └── BeadCanvas.web.tsx  # Web Canvas2D 图纸画布
    ├── core/
    │   ├── types.ts            # 核心类型
    │   ├── color.ts            # 色彩空间转换与 CIEDE2000
    │   ├── palette.ts          # 色板类（预计算 LAB、最近色匹配）
    │   ├── paletteRegistry.ts  # 内置/自定义色板注册与订阅
    │   └── quantize.ts         # 转换主流水线（取色、描边、抖动）
    ├── data/
    │   ├── boards.ts           # 板型定义（29/52/78/104/120）
    │   ├── mard221.json        # 默认 MARD 221 色
    │   └── palettes/           # 其余内置色板数据
    ├── screens/
    │   ├── HomeScreen.tsx      # 导入与历史作品
    │   ├── EditorScreen.tsx    # 参数设置与色板选择
    │   ├── ResultScreen.tsx    # 结果三视图、手动改色、导出
    │   └── PaletteEditorScreen.tsx # 自定义色板编辑
    ├── services/               # 像素读取、图纸渲染、文件/分享、字体、Skia 初始化
    └── store/                  # projectStore / paletteStore（Zustand）
```

---

## 环境要求

- Node.js 18+（开发环境使用 Node 22）
- JDK 17
- Android SDK（compileSdk / targetSdk 36，minSdk 24）与 Android Studio（用于模拟器 / 本地构建）
- 如需使用国内镜像，npm 可指向淘宝源：

```bash
npm config set registry https://registry.npmmirror.com/
```

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动 Metro 开发服务器
npm start

# Web 端运行（浏览器打开 http://localhost:8081）
npm run web

# Android 模拟器 / 真机运行（需先连接设备）
npm run android
```

类型检查：

```bash
npx tsc --noEmit
```

---

## 本地构建 Android APK

项目优先使用本地 Gradle 构建（不依赖 EAS 云端）。先确保 `android/local.properties` 中 `sdk.dir` 指向本机 Android SDK。

```bash
cd android

# 真机版（仅 arm64-v8a，体积小，主流安卓手机通用）
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

# 模拟器版（x86_64）
./gradlew assembleRelease -PreactNativeArchitectures=x86_64

# 全 ABI 通用包
./gradlew assembleRelease
```

产物路径：

```
android/app/build/outputs/apk/release/app-release.apk
```

> `arm64-v8a` 是通用 ABI，任何 arm64 安卓手机（小米 / OPPO / vivo / 华为等）均可安装。

---

## 板型与色板

**内置板型**（豆径 5mm）：标准单板 29×29（默认，Perler/Hama 国际标准）、小板 52、中板 78、大板 104、超大板 120。

**内置色板**：MARD 221（默认）/ MARD 291、Artkal 优肯 C197 / M221、COCO 291、漫漫 278、盼盼 289、咪小窝 290。

---

## 数据来源与致谢

- 豆色数据来自开源数据集 [HansBug/pindou-color-data](https://github.com/HansBug/pindou-color-data)。
- 中文字体使用 [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC)（SIL Open Font License）。
- Web 端 Skia / CanvasKit 运行时由 Expo 与 Skia 项目提供。

---

## License

本项目采用 [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) 授权。

- 个人学习、研究、爱好等**非商业用途**可免费使用、修改与分发；
- 任何**商业用途**（包括但不限于将本软件或其修改版用于商业服务、上架收费或公司经营）均需事先取得书面商业授权。

版权所有 © 2026 钱薇薇。
