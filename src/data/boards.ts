// 拼豆板型定义。钉数 = 单板可容纳的格数（宽/高）。
// 29x29 为 Perler/Hama 国际标准单板，设为默认；52/78/104/120 为国内常见规格。

export interface BoardType {
  id: string;
  name: string;
  /** 单板宽（钉数） */
  width: number;
  /** 单板高（钉数） */
  height: number;
  /** 单颗豆物理尺寸（mm），用于估算成品尺寸 */
  beadMm: number;
  /** 是否为默认 */
  isDefault?: boolean;
  note?: string;
}

export const BOARDS: BoardType[] = [
  {
    id: 'b29',
    name: '标准单板 29×29',
    width: 29,
    height: 29,
    beadMm: 5,
    isDefault: true,
    note: 'Perler / Hama 国际标准单板',
  },
  {
    id: 'b52',
    name: '小板 52×52',
    width: 52,
    height: 52,
    beadMm: 5,
    note: '国内常见小板',
  },
  {
    id: 'b78',
    name: '中板 78×78',
    width: 78,
    height: 78,
    beadMm: 5,
    note: '国内常见中板',
  },
  {
    id: 'b104',
    name: '大板 104×104',
    width: 104,
    height: 104,
    beadMm: 5,
    note: '国内常见大板',
  },
  {
    id: 'b120',
    name: '超大板 120×120',
    width: 120,
    height: 120,
    beadMm: 5,
    note: '国内超大板',
  },
];

export const DEFAULT_BOARD = BOARDS.find((b) => b.isDefault) ?? BOARDS[0];

/** 给定成品格数与板型，计算横/竖各需几块板 */
export function boardCountFor(
  gridW: number,
  gridH: number,
  board: BoardType,
): { cols: number; rows: number; total: number } {
  const cols = Math.max(1, Math.ceil(gridW / board.width));
  const rows = Math.max(1, Math.ceil(gridH / board.height));
  return { cols, rows, total: cols * rows };
}
