// 内置 CJK 字库：Android 系统 Skia FontMgr 只暴露拉丁字体，
// 直接 matchFamilyStyle('sans-serif') 渲染中文会变方框，故随包带一份 Noto Sans SC。
import { Skia } from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import type { SkTypeface } from '@shopify/react-native-skia';

let cached: SkTypeface | null = null;
let loading: Promise<SkTypeface | null> | null = null;

export async function ensureCjkFont(): Promise<SkTypeface | null> {
  // web 用浏览器字体即可，无需加载
  if (Platform.OS === 'web') return null;
  if (cached) return cached;
  if (loading) return loading;

  loading = (async () => {
    try {
      // 懒加载，避免把 expo-asset 打进 web 包
      const { Asset } = require('expo-asset');
      const asset = Asset.fromModule(
        require('../../assets/fonts/NotoSansSC.ttf'),
      );
      await asset.downloadAsync();
      const uri: string | undefined = asset.localUri ?? asset.uri;
      if (!uri) return null;
      const data = await Skia.Data.fromURI(uri);
      const tf = Skia.Typeface.MakeFreeTypeFaceFromData(data);
      cached = tf ?? null;
      return cached;
    } catch (e) {
      console.warn('CJK font load failed', e);
      return null;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export function getCjkTypeface(): SkTypeface | null {
  return cached;
}
