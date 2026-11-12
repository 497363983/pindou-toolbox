// 图片 -> 拼豆图纸 转换流水线（纯 TS，输入 RGBA 像素缓冲）
// 网格化 -> 每格目标色（区域均值/主导色）-> Floyd–Steinberg 抖动 -> 映射真实豆色号 -> 用料统计

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
  const dither = options.dither ?? 'floyd';
  const bucketStep = options.bucketStep ?? 12;
  const alphaThreshold = options.alphaThreshold ?? 10;

  const cells = new Int32Array(gridW * gridH).fill(-1);
  const counts = new Map<number, number>();

  const cellW = src.width / gridW;
  const cellH = src.height / gridH;
  const N = gridW * gridH;

  // 每格的区域累加（均值目标）与不透明掩码
  const sumR = new Float64Array(N);
  const sumG = new Float64Array(N);
  const sumB = new Float64Array(N);
  const opaqueN = new Int32Array(N);

  for (let gy = 0; gy < gridH; gy++) {
    const py0 = Math.floor(gy * cellH);
    const py1 = Math.max(py0 + 1, Math.floor((gy + 1) * cellH));
    for (let gx = 0; gx < gridW; gx++) {
      const px0 = Math.floor(gx * cellW);
      const px1 = Math.max(px0 + 1, Math.floor((gx + 1) * cellW));
      const k = gy * gridW + gx;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let op = 0;
      for (let y = py0; y < py1; y++) {
        for (let x = px0; x < px1; x++) {
          const idx = (y * src.width + x) * 4;
          if (src.data[idx + 3] < alphaThreshold) continue;
          sr += src.data[idx];
          sg += src.data[idx + 1];
          sb += src.data[idx + 2];
          op++;
        }
      }
      sumR[k] = sr;
      sumG[k] = sg;
      sumB[k] = sb;
      opaqueN[k] = op;
    }
  }

  let totalBeads = 0;
  const place = (k: number, beadIdx: number) => {
    cells[k] = beadIdx;
    counts.set(beadIdx, (counts.get(beadIdx) ?? 0) + 1);
    totalBeads++;
  };

  if (dither === 'floyd') {
    // 工作缓冲（目标色，随误差扩散而改变）
    const tr = new Float64Array(N);
    const tg = new Float64Array(N);
    const tb = new Float64Array(N);
    for (let k = 0; k < N; k++) {
      const op = opaqueN[k];
      if (op > 0) {
        tr[k] = sumR[k] / op;
        tg[k] = sumG[k] / op;
        tb[k] = sumB[k] / op;
      }
    }
    const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
    const addErr = (k: number, er: number, eg: number, eb: number, w: number) => {
      if (k < 0 || k >= N || opaqueN[k] === 0) return;
      tr[k] += er * w;
      tg[k] += eg * w;
      tb[k] += eb * w;
    };

    for (let gy = 0; gy < gridH; gy++) {
      const reverse = gy % 2 === 1;
      for (let s = 0; s < gridW; s++) {
        const gx = reverse ? gridW - 1 - s : s;
        const k = gy * gridW + gx;
        if (opaqueN[k] === 0) continue;
        const beadIdx = palette.nearestIndex(clamp(tr[k]), clamp(tg[k]), clamp(tb[k]));
        place(k, beadIdx);
        const bead = palette.beads[beadIdx].rgb;
        const er = tr[k] - bead.r;
        const eg = tg[k] - bead.g;
        const eb = tb[k] - bead.b;
        const row = gy * gridW;
        const next = row + gridW;
        if (!reverse) {
          addErr(row + gx + 1 < row + gridW ? k + 1 : -1, er, eg, eb, 7 / 16);
          addErr(next + gx - 1 >= next ? k + gridW - 1 : -1, er, eg, eb, 3 / 16);
          addErr(next + gx < next + gridW ? k + gridW : -1, er, eg, eb, 5 / 16);
          addErr(next + gx + 1 < next + gridW ? k + gridW + 1 : -1, er, eg, eb, 1 / 16);
        } else {
          addErr(row + gx - 1 >= row ? k - 1 : -1, er, eg, eb, 7 / 16);
          addErr(next + gx + 1 < next + gridW ? k + gridW + 1 : -1, er, eg, eb, 3 / 16);
          addErr(next + gx < next + gridW ? k + gridW : -1, er, eg, eb, 5 / 16);
          addErr(next + gx - 1 >= next ? k + gridW - 1 : -1, er, eg, eb, 1 / 16);
        }
      }
    }
  } else {
    for (let k = 0; k < N; k++) {
      const op = opaqueN[k];
      if (op === 0) continue;
      let repR = sumR[k] / op;
      let repG = sumG[k] / op;
      let repB = sumB[k] / op;

      if (sampling === 'dominant') {
        const gy = Math.floor(k / gridW);
        const gx = k % gridW;
        const py0 = Math.floor(gy * cellH);
        const py1 = Math.max(py0 + 1, Math.floor((gy + 1) * cellH));
        const px0 = Math.floor(gx * cellW);
        const px1 = Math.max(px0 + 1, Math.floor((gx + 1) * cellW));
        const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
        let darkN = 0;
        let darkR = 0;
        let darkG = 0;
        let darkB = 0;
        for (let y = py0; y < py1; y++) {
          for (let x = px0; x < px1; x++) {
            const idx = (y * src.width + x) * 4;
            if (src.data[idx + 3] < alphaThreshold) continue;
            const r = src.data[idx];
            const g = src.data[idx + 1];
            const b = src.data[idx + 2];
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luma < 70) {
              darkN++;
              darkR += r;
              darkG += g;
              darkB += b;
            }
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
          }
        }
        if (darkN / op >= 0.16) {
          // 轮廓保留：深色描边占比足够高时直接用深色，保证线条连贯
          repR = darkR / darkN;
          repG = darkG / darkN;
          repB = darkB / darkN;
        } else {
          let best: { n: number; r: number; g: number; b: number } | null = null;
          for (const bk of buckets.values()) {
            if (!best || bk.n > best.n) best = bk;
          }
          if (best) {
            repR = best.r / best.n;
            repG = best.g / best.n;
            repB = best.b / best.n;
          }
          // 提升饱和与对比，并轻微 gamma 压暗，避免白底抗锯齿导致整体发浅
          const sat = 1.4;
          const ctr = 1.18;
          const gamma = 0.82;
          const mx = Math.max(repR, repG, repB);
          const enhance = (v: number) => {
            const a = v + (v - 128) * (ctr - 1);
            let out = a + (a - mx) * (sat - 1);
            out = 255 * Math.pow(Math.max(0, out) / 255, gamma);
            return out < 0 ? 0 : out > 255 ? 255 : out;
          };
          repR = enhance(repR);
          repG = enhance(repG);
          repB = enhance(repB);
        }
      }
      place(k, palette.nearestIndex(repR, repG, repB));
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
