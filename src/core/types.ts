// 拼豆转换核心类型

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** 一颗豆（色板中的一个颜色） */
export interface BeadColor {
  /** 品牌色号，如 A9 */
  code: string;
  hex: string;
  rgb: RGB;
  /** 色系分组，如 A */
  group: string;
}

/** 一个成品项目的转换参数 */
export interface ConvertOptions {
  /** 目标网格宽（格） */
  gridW: number;
  /** 目标网格高（格） */
  gridH: number;
  /** 取色方式：dominant=主导色（默认，边界清晰）；average=平均色 */
  sampling?: 'dominant' | 'average';
  /** 主导色量化步长（每通道），越小越精细、越抗噪越弱，默认 16 */
  bucketStep?: number;
  /** 透明像素（alpha 小于该值）视为空，默认 10 */
  alphaThreshold?: number;
}

/** 转换结果 */
export interface BeadPattern {
  gridW: number;
  gridH: number;
  /** 每格的豆在色板中的下标；-1 表示空（透明/背景） */
  cells: Int32Array;
  /** 用料清单：色板下标 -> 数量 */
  counts: Map<number, number>;
  /** 用到的颜色数 */
  colorCount: number;
  /** 总豆数（不含空格） */
  totalBeads: number;
}
