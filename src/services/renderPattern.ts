// 离屏高清渲染：把成品渲染成预览图或带色号的施工图纸，输出 PNG 文件
import { Skia, type SkImage } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import type { Palette } from '../core/palette';
import type { BeadPattern } from '../core/types';
import { theme } from '../theme';

export type RenderMode = 'preview' | 'chart';

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * 渲染并保存为 PNG，返回文件 uri。
 */
export function renderPatternToFile(
  pattern: BeadPattern,
  palette: Palette,
  mode: RenderMode,
  boardSize?: number,
): string {
  const { gridW, gridH, cells } = pattern;

  // 每格像素：图纸模式保证色号可读，预览模式紧凑
  const maxDim = mode === 'chart' ? 4200 : 2200;
  let cell = Math.floor(maxDim / Math.max(gridW, gridH));
  cell = mode === 'chart' ? Math.max(10, Math.min(46, cell)) : Math.max(6, Math.min(28, cell));
  const drawText = mode === 'chart' && cell >= 16;

  const pad = mode === 'chart' ? 24 : 0;
  const W = cell * gridW + pad * 2;
  const H = cell * gridH + pad * 2;

  const surface = Skia.Surface.Make(W, H)!;
  const canvas = surface.getCanvas();
  canvas.drawColor(Skia.Color(mode === 'chart' ? '#FFFFFF' : theme.colors.bg));

  const typeface = Skia.FontMgr.System().matchFamilyStyle('sans-serif', {});
  const fontSize = Math.floor(cell * 0.42);
  const font = Skia.Font(typeface, fontSize);

  // 每格填色 + 色号
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const idx = cells[gy * gridW + gx];
      const x = pad + gx * cell;
      const y = pad + gy * cell;
      let hex = theme.colors.empty;
      if (idx >= 0) hex = palette.beads[idx].hex;
      const rectPaint = Skia.Paint();
      rectPaint.setColor(Skia.Color(hex));
      const inset = mode === 'preview' ? Math.max(0.5, cell * 0.1) : 0;
      canvas.drawRect(
        Skia.XYWHRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2),
        rectPaint,
      );

      if (drawText && idx >= 0) {
        const { r, g, b } = palette.beads[idx].rgb;
        const textPaint = Skia.Paint();
        textPaint.setColor(Skia.Color(luminance(r, g, b) > 0.6 ? '#2B2823' : '#FFFFFF'));
        const code = palette.beads[idx].code;
        const metrics = font.measureText(code);
        const tx = x + (cell - metrics.width) / 2;
        const ty = y + cell / 2 + fontSize * 0.35;
        canvas.drawText(code, tx, ty, textPaint, font);
      }
    }
  }

  // 网格线（图纸模式）
  if (mode === 'chart') {
    const linePaint = Skia.Paint();
    linePaint.setColor(Skia.Color('#E2DED4'));
    linePaint.setStrokeWidth(1);
    for (let gx = 0; gx <= gridW; gx++) {
      const x = pad + gx * cell;
      canvas.drawLine(x, pad, x, pad + gridH * cell, linePaint);
    }
    for (let gy = 0; gy <= gridH; gy++) {
      const y = pad + gy * cell;
      canvas.drawLine(pad, y, pad + gridW * cell, y, linePaint);
    }
  }

  // 拼豆板边界
  if (boardSize && boardSize > 0) {
    const bp = Skia.Paint();
    bp.setColor(Skia.Color(theme.colors.primaryDeep));
    bp.setStrokeWidth(2.5);
    for (let gx = boardSize; gx < gridW; gx += boardSize) {
      const x = pad + gx * cell;
      canvas.drawLine(x, pad, x, pad + gridH * cell, bp);
    }
    for (let gy = boardSize; gy < gridH; gy += boardSize) {
      const y = pad + gy * cell;
      canvas.drawLine(pad, y, pad + gridW * cell, y, bp);
    }
  }

  const snapshot: SkImage = surface.makeImageSnapshot();
  const b64 = snapshot.encodeToBase64();
  const uri = FileSystem.cacheDirectory + `pindou-${mode}-${Date.now()}.png`;
  FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}
