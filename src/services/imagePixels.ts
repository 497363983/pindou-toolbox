// 用 Skia 读取图片像素：文件转 base64 -> 解码 SkImage -> 按网格比例 cover 重采样 -> readPixels
import { Skia, type SkImage } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import type { PixelSource } from '../core/quantize';

export interface WorkPixels extends PixelSource {
  sourceW: number;
  sourceH: number;
}

async function loadSkImage(uri: string): Promise<SkImage> {
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const data = Skia.Data.fromBase64(b64);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('无法解码图片');
  return image;
}

/**
 * 读取并按目标网格比例重采样像素。
 * samplePerCell：每格在工作缓冲中采样的像素边长（越大越精细、越慢）。
 */
export async function readImagePixels(
  uri: string,
  gridW: number,
  gridH: number,
  samplePerCell = 8,
  maxWork = 1024,
): Promise<WorkPixels> {
  const image = await loadSkImage(uri);
  const sourceW = image.width();
  const sourceH = image.height();

  // 工作缓冲：贴合网格宽高比，限制最大边
  let workW = gridW * samplePerCell;
  let workH = gridH * samplePerCell;
  const m = Math.max(workW, workH);
  if (m > maxWork) {
    const k = maxWork / m;
    workW = Math.max(1, Math.round(workW * k));
    workH = Math.max(1, Math.round(workH * k));
  }

  const surface = Skia.Surface.Make(workW, workH);
  if (!surface) throw new Error('无法创建绘图层');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('rgba(0,0,0,0)'));

  // cover 适配（居中裁剪）
  const targetAspect = workW / workH;
  const srcAspect = sourceW / sourceH;
  let sx = 0;
  let sy = 0;
  let sw = sourceW;
  let sh = sourceH;
  if (srcAspect > targetAspect) {
    sw = Math.round(sourceH * targetAspect);
    sx = Math.round((sourceW - sw) / 2);
  } else {
    sh = Math.round(sourceW / targetAspect);
    sy = Math.round((sourceH - sh) / 2);
  }

  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  const srcRect = Skia.XYWHRect(sx, sy, sw, sh);
  const dstRect = Skia.XYWHRect(0, 0, workW, workH);
  canvas.drawImageRect(image, srcRect, dstRect, paint);

  const snapshot = surface.makeImageSnapshot();
  const pixels = snapshot.readPixels() as Uint8Array;
  if (!pixels) throw new Error('读取像素失败');

  return { data: pixels, width: workW, height: workH, sourceW, sourceH };
}
