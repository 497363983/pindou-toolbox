// 色板加载与最近豆色匹配（预计算 LAB，逐格做 CIEDE2000 最近邻）

import { ciede2000, rgbToLab, type LAB } from './color';
import type { BeadColor } from './types';

interface PaletteJson {
  id: string;
  title: string;
  count: number;
  colors: Array<{
    code: string;
    hex: string;
    rgb: [number, number, number];
    group: string;
  }>;
}

export class Palette {
  id: string;
  title: string;
  beads: BeadColor[];
  private labs: LAB[];

  constructor(json: PaletteJson) {
    this.id = json.id;
    this.title = json.title;
    this.beads = json.colors.map((c) => ({
      code: c.code,
      hex: c.hex,
      group: c.group,
      rgb: { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] },
    }));
    this.labs = this.beads.map((b) => rgbToLab(b.rgb));
  }

  get size(): number {
    return this.beads.length;
  }

  /** 返回与给定 RGB 最接近的豆在色板中的下标 */
  nearestIndex(r: number, g: number, b: number): number {
    const target = rgbToLab({ r, g, b });
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < this.labs.length; i++) {
      const d = ciede2000(target, this.labs[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }
}

import mard221Json from '../data/mard221.json';

let defaultPalette: Palette | null = null;

/** 默认色板：MARD 221（国内最主流） */
export function getDefaultPalette(): Palette {
  if (!defaultPalette) {
    defaultPalette = new Palette(mard221Json as unknown as PaletteJson);
  }
  return defaultPalette;
}
