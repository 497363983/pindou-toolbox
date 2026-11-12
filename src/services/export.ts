// 跨平台导出/分享：原生走系统相册与分享面板；web 走浏览器下载
import { Platform } from 'react-native';

function browserDownload(uri: string, filename: string) {
  const a = document.createElement('a');
  a.href = uri;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** 保存图片：原生存相册，web 直接下载 */
export async function saveToGallery(uri: string, filename = 'pindou-chart.png'): Promise<boolean> {
  if (Platform.OS === 'web') {
    browserDownload(uri, filename);
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const MediaLibrary = require('expo-media-library');
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) return false;
  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}

/** 分享图片：原生调分享面板，web 优先 Web Share，否则下载 */
export async function shareImage(uri: string, filename = 'pindou-chart.png'): Promise<boolean> {
  if (Platform.OS === 'web') {
    const navAny = navigator as any;
    if (navAny.canShare && navAny.share) {
      try {
        const file = await (await fetch(uri)).blob();
        const filesArr = [new File([file], filename, { type: 'image/png' })];
        if (navAny.canShare({ files: filesArr })) {
          await navAny.share({ files: filesArr, title: '拼豆图纸' });
          return true;
        }
      } catch {
        /* fall through to download */
      }
    }
    browserDownload(uri, filename);
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sharing = require('expo-sharing');
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
    return true;
  }
  return false;
}
