// 离屏高清渲染：把成品渲染成预览图或带色号的施工图纸，输出 PNG 文件
import { Skia } from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import type { Palette } from '../core/palette';
import type { BeadPattern } from '../core/types';
import { theme } from '../theme';
import { writeCachePng } from './files';
import { getCjkTypeface } from './cjkFont';

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
  if (Platform.OS === 'web') {
    return renderPatternWeb(pattern, palette, mode, boardSize);
  }
  const { gridW, gridH, cells } = pattern;

  // 每格像素：图纸模式保证色号可读，预览模式紧凑
  const maxDim = mode === 'chart' ? 4200 : 2200;
  let cell = Math.floor(maxDim / Math.max(gridW, gridH));
  cell = mode === 'chart' ? Math.max(10, Math.min(46, cell)) : Math.max(6, Math.min(28, cell));
  const drawText = mode === 'chart' && cell >= 16;

  const pad = mode === 'chart' ? 24 : 0;
  const chartW = cell * gridW + pad * 2;
  const chartH = cell * gridH + pad * 2;

  const surface = Skia.Surface.Make(chartW, chartH)!;
  const canvas = surface.getCanvas();
  canvas.drawColor(Skia.Color(mode === 'chart' ? '#FFFFFF' : theme.colors.bg));

  // 系统 Skia FontMgr 在 Android 上只暴露拉丁字体、无 CJK 族；用内置 CJK 字库渲染中文
  const cjkTypeface = getCjkTypeface();
  const typeface = cjkTypeface ?? Skia.FontMgr.System().matchFamilyStyle('sans-serif', {});
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

  const chartImage = surface.makeImageSnapshot();

  // 预览模式：图纸即成品；图纸模式：在下方拼颜色清单
  if (mode === 'preview') {
    const b64 = chartImage.encodeToBase64();
    return writeCachePng(`pindou-preview-${Date.now()}.png`, b64);
  }

  const items = [...pattern.counts.entries()]
    .map(([idx, n]) => ({ bead: palette.beads[idx], n }))
    .sort((a, b) => b.n - a.n);
  const M = Math.round(chartW * 0.022) + 18;
  const cols = 8;
  const gap = Math.round(M * 0.55);
  const sw = Math.floor((chartW - 2 * M - (cols - 1) * gap) / cols);
  const sh = Math.floor(sw * 0.72);
  const pitchY = sh + Math.round(sw * 0.18) + 24;
  const rows = Math.ceil(items.length / cols);
  const legendH = M + 96 + 56 + rows * pitchY + M;
  const finalW = chartW;
  const finalH = chartH + legendH;

  const finalSurface = Skia.Surface.Make(finalW, finalH)!;
  const fc = finalSurface.getCanvas();
  fc.drawColor(Skia.Color('#FFFFFF'));
  fc.drawImage(chartImage, 0, 0);

  const titleFont = Skia.Font(typeface, 64);
  const codeFont = Skia.Font(typeface, 46);
  const countFont = Skia.Font(typeface, 40);
  const titlePaint = Skia.Paint();
  titlePaint.setColor(Skia.Color('#2B2622'));
  fc.drawText(`颜色清单：${palette.title} · 共 ${pattern.totalBeads} 豆`, M, chartH + M + 64, titlePaint, titleFont);

  const top = chartH + M + 96 + 56;
  const darkPaint = Skia.Paint();
  darkPaint.setColor(Skia.Color('#2B2622'));
  const whitePaint = Skia.Paint();
  whitePaint.setColor(Skia.Color('#FFFFFF'));
  const countPaint = Skia.Paint();
  countPaint.setColor(Skia.Color('#6B645C'));

  for (let i = 0; i < items.length; i++) {
    const r = Math.floor(i / cols);
    const cc = i % cols;
    const px = M + cc * (sw + gap);
    const py = top + r * pitchY;
    const { bead, n } = items[i];
    const swPaint = Skia.Paint();
    swPaint.setColor(Skia.Color(bead.hex));
    const rrect = Skia.RRectXY(Skia.XYWHRect(px, py, sw, sh), 22, 22);
    fc.drawRRect(rrect, swPaint);
    const { r: rr2, g: gg, b: bb } = bead.rgb;
    const tp = luminance(rr2, gg, bb) > 0.6 ? darkPaint : whitePaint;
    const codeW = codeFont.measureText(bead.code).width;
    fc.drawText(bead.code, px + (sw - codeW) / 2, py + sh / 2 + 16, tp, codeFont);
    fc.drawText(`×${n}`, px + 6, py + sh + 46, countPaint, countFont);
  }

  const finalImage = finalSurface.makeImageSnapshot();
  const b64 = finalImage.encodeToBase64();
  return writeCachePng(`pindou-chart-${Date.now()}.png`, b64);
}

// web 端：浏览器 Canvas 2D 渲染，直接返回 dataURL（不依赖 Skia 离屏 API）
function renderPatternWeb(
  pattern: BeadPattern,
  palette: Palette,
  mode: RenderMode,
  boardSize?: number,
): string {
  const { gridW, gridH, cells } = pattern;
  const maxDim = mode === 'chart' ? 4200 : 2200;
  let cell = Math.floor(maxDim / Math.max(gridW, gridH));
  cell = mode === 'chart' ? Math.max(10, Math.min(46, cell)) : Math.max(6, Math.min(28, cell));
  const drawText = mode === 'chart' && cell >= 16;
  const pad = mode === 'chart' ? 24 : 0;
  const W = cell * gridW + pad * 2;
  const H = cell * gridH + pad * 2;

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = mode === 'chart' ? '#FFFFFF' : theme.colors.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.font = `${Math.floor(cell * 0.42)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const idx = cells[gy * gridW + gx];
      const x = pad + gx * cell;
      const y = pad + gy * cell;
      let hex = theme.colors.empty;
      let code = '';
      if (idx >= 0) {
        hex = palette.beads[idx].hex;
        code = palette.beads[idx].code;
      }
      const inset = mode === 'preview' ? Math.max(0.5, cell * 0.1) : 0;
      ctx.fillStyle = hex;
      ctx.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2);
      if (drawText && idx >= 0) {
        const { r, g, b } = palette.beads[idx].rgb;
        ctx.fillStyle = luminance(r, g, b) > 0.6 ? '#2B2823' : '#FFFFFF';
        ctx.fillText(code, x + cell / 2, y + cell / 2);
      }
    }
  }

  if (mode === 'chart') {
    ctx.strokeStyle = '#E2DED4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx <= gridW; gx++) {
      const x = pad + gx * cell;
      ctx.moveTo(x, pad); ctx.lineTo(x, pad + gridH * cell);
    }
    for (let gy = 0; gy <= gridH; gy++) {
      const y = pad + gy * cell;
      ctx.moveTo(pad, y); ctx.lineTo(pad + gridW * cell, y);
    }
    ctx.stroke();
  }

  if (boardSize && boardSize > 0) {
    ctx.strokeStyle = theme.colors.primaryDeep;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let gx = boardSize; gx < gridW; gx += boardSize) {
      const x = pad + gx * cell;
      ctx.moveTo(x, pad); ctx.lineTo(x, pad + gridH * cell);
    }
    for (let gy = boardSize; gy < gridH; gy += boardSize) {
      const y = pad + gy * cell;
      ctx.moveTo(pad, y); ctx.lineTo(pad + gridW * cell, y);
    }
    ctx.stroke();
  }

  if (mode === 'chart') {
    // 合成颜色清单到图纸下方
    const items = [...pattern.counts.entries()]
      .map(([idx, n]) => ({ bead: palette.beads[idx], n }))
      .sort((a, b) => b.n - a.n);
    const M = Math.round(W * 0.022) + 18;
    const cols = 8;
    const gap = Math.round(M * 0.55);
    const sw = Math.floor((W - 2 * M - (cols - 1) * gap) / cols);
    const sh = Math.floor(sw * 0.72);
    const pitchY = sh + Math.round(sw * 0.18) + 24;
    const rows = Math.ceil(items.length / cols);
    const legendH = M + 96 + 56 + rows * pitchY + M;
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H + legendH;
    const o = out.getContext('2d')!;
    o.fillStyle = '#FFFFFF';
    o.fillRect(0, 0, W, H + legendH);
    o.drawImage(cv, 0, 0);
    o.fillStyle = '#2B2622';
    o.textAlign = 'left';
    o.textBaseline = 'alphabetic';
    o.font = `bold 64px sans-serif`;
    o.fillText(`颜色清单：${palette.title} · 共 ${pattern.totalBeads} 豆`, M, H + M + 64);
    const top = H + M + 96 + 56;
    for (let i = 0; i < items.length; i++) {
      const r = Math.floor(i / cols);
      const cc = i % cols;
      const px = M + cc * (sw + gap);
      const py = top + r * pitchY;
      const { bead, n } = items[i];
      o.fillStyle = bead.hex;
      o.beginPath();
      o.roundRect(px, py, sw, sh, 22);
      o.fill();
      o.lineWidth = 2;
      o.strokeStyle = 'rgba(0,0,0,0.12)';
      o.stroke();
      const { r: rr2, g: gg, b: bb } = bead.rgb;
      o.fillStyle = luminance(rr2, gg, bb) > 0.6 ? '#2B2622' : '#FFFFFF';
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      o.font = `bold 46px sans-serif`;
      o.fillText(bead.code, px + sw / 2, py + sh / 2);
      o.fillStyle = '#6B645C';
      o.textAlign = 'left';
      o.textBaseline = 'alphabetic';
      o.font = `40px sans-serif`;
      o.fillText(`×${n}`, px + 6, py + sh + 46);
    }
    return out.toDataURL('image/png');
  }

  return cv.toDataURL('image/png');
}
