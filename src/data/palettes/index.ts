// 内置色板清单（主流品牌标准）。数据来自 HansBug/pindou-color-data。
import mard221 from '../mard221.json';
import mard291 from './mard291.json';
import artkalC197 from './artkalC197.json';
import artkalM221 from './artkalM221.json';
import coco291 from './coco291.json';
import manman278 from './manman278.json';
import panpan289 from './panpan289.json';
import mixiaowo290 from './mixiaowo290.json';

export interface RawPalette {
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

export interface BuiltinDef {
  /** 原始 JSON */
  raw: RawPalette;
  /** 显示用品牌名 */
  brand: string;
  /** 主流度档位 */
  tier: 'S' | 'A' | 'B';
  /** 一句话说明 */
  note: string;
}

export const BUILTIN_PALETTES: BuiltinDef[] = [
  {
    raw: mard221 as unknown as RawPalette,
    brand: 'MARD',
    tier: 'S',
    note: '国内最主流 · 221 色（默认）',
  },
  {
    raw: mard291 as unknown as RawPalette,
    brand: 'MARD',
    tier: 'S',
    note: 'MARD 完整版 · 291 色',
  },
  {
    raw: artkalC197 as unknown as RawPalette,
    brand: 'Artkal 优肯',
    tier: 'A',
    note: '优肯 C 系列 · 197 色',
  },
  {
    raw: artkalM221 as unknown as RawPalette,
    brand: 'Artkal 优肯',
    tier: 'A',
    note: '优肯 Mini · 221 色',
  },
  {
    raw: coco291 as unknown as RawPalette,
    brand: 'COCO',
    tier: 'A',
    note: '高性价比 · 291 色',
  },
  {
    raw: manman278 as unknown as RawPalette,
    brand: '漫漫',
    tier: 'B',
    note: '老牌 · 278 色',
  },
  {
    raw: panpan289 as unknown as RawPalette,
    brand: '盼盼',
    tier: 'B',
    note: '289 色',
  },
  {
    raw: mixiaowo290 as unknown as RawPalette,
    brand: '咪小窝',
    tier: 'B',
    note: '290 色',
  },
];

export const DEFAULT_PALETTE_ID = mard221.id;
