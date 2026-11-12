// 色板注册表：按 id 取得 Palette（内置 + 自定义）
import { BUILTIN_PALETTES, type RawPalette } from '../data/palettes';
import { usePaletteStore } from '../store/paletteStore';
import { Palette, getDefaultPalette } from './palette';

const cache = new Map<string, Palette>();

export function getPaletteById(id: string): Palette {
  const builtin = BUILTIN_PALETTES.find((b) => b.raw.id === id);
  if (builtin) {
    let p = cache.get(id);
    if (!p) {
      p = new Palette(builtin.raw as RawPalette);
      cache.set(id, p);
    }
    return p;
  }
  const custom = usePaletteStore.getState().custom.find((c) => c.id === id);
  if (custom) {
    // 自定义色板每次取最新数据并覆盖缓存
    const p = new Palette(custom);
    cache.set(id, p);
    return p;
  }
  return getDefaultPalette();
}

export interface PaletteInfo {
  id: string;
  title: string;
  brand: string;
  count: number;
  custom: boolean;
  note?: string;
  tier?: 'S' | 'A' | 'B';
}

/** 订阅式色板列表（内置 + 自定义），用于选择 UI */
export function usePaletteList(): PaletteInfo[] {
  const custom = usePaletteStore((s) => s.custom);
  const builtinInfos: PaletteInfo[] = BUILTIN_PALETTES.map((b) => ({
    id: b.raw.id,
    title: b.raw.title,
    brand: b.brand,
    count: b.raw.count,
    custom: false,
    note: b.note,
    tier: b.tier,
  }));
  const customInfos: PaletteInfo[] = custom.map((c) => ({
    id: c.id,
    title: c.title,
    brand: '自定义',
    count: c.colors.length,
    custom: true,
  }));
  return [...customInfos, ...builtinInfos];
}
