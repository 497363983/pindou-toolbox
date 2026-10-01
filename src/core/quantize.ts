// 图片 -> 拼豆图纸 转换流水线（纯 TS，输入 RGBA 像素缓冲）
// 网格化重采样 -> 每格取色（主导色/平均色）-> 映射真实豆色号 -> 用料统计

import type { Palette } from './palette';
import type { BeadPattern, ConvertOptions } from './types';

export interface PixelSource {
  /** RGBA，长度 = width*height*4 */
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
}

export function convertToBeads(
  src: PixelSource,
  palette: Palette,
  options: ConvertOptions,
): BeadPattern {
  const { gridW, gridH } = options;
  const sampling = options.sampling ?? 'dominant';
  const bucketStep = options.bucketStep ?? 16;
  const alphaThreshold = options.alphaThreshold ?? 10;

  const cells = new Int32Array(gridW * gridH).fill(-1);
  const counts = new Map<number, number>();

  const cellW = src.width / gridW;
  const cellH = src.height / gridH;

  let totalBeads = 0;

  for (let gy = 0; gy < gridH; gy++) {
    const py0 = Math.floor(gy * cellH);
    const py1 = Math.max(py0 + 1, Math.floor((gy + 1) * cellH));

    for (let gx = 0; gx < gridW; gx++) {
      const px0 = Math.floor(gx * cellW);
      const px1 = Math.max(px0 + 1, Math.floor((gx + 1) * cellW));

      let repR = 0;
      let repG = 0;
      let repB = 0;
      let opaque = 0;

      if (sampling === 'average') {
        let sr = 0;
        let sg = 0;
        let sb = 0;
        for (let y = py0; y < py1; y++) {
          for (let x = px0; x < px1; x++) {
            const idx = (y * src.width + x) * 4;
            if (src.data[idx + 3] < alphaThreshold) continue;
            sr += src.data[idx];
            sg += src.data[idx + 1];
            sb += src.data[idx + 2];
            opaque++;
          }
        }
        if (opaque > 0) {
          repR = sr / opaque;
          repG = sg / opaque;
          repB = sb / opaque;
        }
      } else {
        // dominant：粗量化分桶，取出现最多的桶，代表色为桶内像素均值
        const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
        for (let y = py0; y < py1; y++) {
          for (let x = px0; x < px1; x++) {
            const idx = (y * src.width + x) * 4;
            if (src.data[idx + 3] < alphaThreshold) continue;
            const r = src.data[idx];
            const g = src.data[idx + 1];
            const b = src.data[idx + 2];
            const key =
              ((Math.round(r / bucketStep) << 16) |
                (Math.round(g / bucketStep) << 8) |
                Math.round(b / bucketStep)) >>> 0;
            const bk = buckets.get(key);
            if (bk) {
              bk.n++;
              bk.r += r;
              bk.g += g;
              bk.b += b;
            } else {
              buckets.set(key, { n: 1, r, g, b });
            }
            opaque++;
          }
        }
        if (opaque > 0) {
          let best: { n: number; r: number; g: number; b: number } | null = null;
          for (const bk of buckets.values()) {
            if (!best || bk.n > best.n) best = bk;
          }
          if (best) {
            repR = best.r / best.n;
            repG = best.g / best.n;
            repB = best.b / best.n;
          }
        }
      }

      if (opaque > 0) {
        const beadIdx = palette.nearestIndex(repR, repG, repB);
        cells[gy * gridW + gx] = beadIdx;
        counts.set(beadIdx, (counts.get(beadIdx) ?? 0) + 1);
        totalBeads++;
      }
    }
  }

  return {
    gridW,
    gridH,
    cells,
    counts,
    colorCount: counts.size,
    totalBeads,
  };
}
