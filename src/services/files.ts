// 跨平台文件写入：原生写入缓存目录返回 file uri；web 返回 data URI
import { Platform } from 'react-native';

export function writeCachePng(name: string, base64: string): string {
  if (Platform.OS === 'web') {
    return `data:image/png;base64,${base64}`;
  }
  // 仅在原生端加载，避免 web 打包原生模块
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FS = require('expo-file-system/legacy');
  const uri = FS.cacheDirectory + name;
  FS.writeAsStringAsync(uri, base64, { encoding: FS.EncodingType.Base64 });
  return uri;
}
