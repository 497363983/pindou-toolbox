// 拼豆网格渲染：Skia 绘制每颗豆 + 网格线 + 拼豆板边界
import { Canvas, Group, Path, Rect } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Skia } from '@shopify/react-native-skia';
import type { Palette } from '../core/palette';
import type { BeadPattern } from '../core/types';
import { theme } from '../theme';

interface Props {
  pattern: BeadPattern;
  palette: Palette;
  width: number;
  height: number;
  showGrid?: boolean;
  /** 是否给豆子圆角（更像豆） */
  rounded?: boolean;
  boardSize?: number;
}

export function BeadCanvas({
  pattern,
  palette,
  width,
  height,
  showGrid = true,
  rounded = true,
  boardSize,
}: Props) {
  const { gridW, gridH, cells } = pattern;

  const layout = useMemo(() => {
    const cell = Math.min(width / gridW, height / gridH);
    const drawW = cell * gridW;
    const drawH = cell * gridH;
    const ox = (width - drawW) / 2;
    const oy = (height - drawH) / 2;
    return { cell, ox, oy };
  }, [width, height, gridW, gridH]);

  const beads = useMemo(() => {
    const inset = rounded ? Math.max(0.5, layout.cell * 0.12) : 0;
    const list: Array<{ x: number; y: number; s: number; color: string }> = [];
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const idx = cells[gy * gridW + gx];
        if (idx < 0) continue;
        const x = layout.ox + gx * layout.cell + inset;
        const y = layout.oy + gy * layout.cell + inset;
        list.push({
          x,
          y,
          s: layout.cell - inset * 2,
          color: palette.beads[idx].hex,
        });
      }
    }
    return list;
  }, [cells, palette, layout, gridW, gridH, rounded]);

  const gridPath = useMemo(() => {
    if (!showGrid || layout.cell < 5) return null;
    const p = Skia.Path.Make();
    for (let gx = 0; gx <= gridW; gx++) {
      const x = layout.ox + gx * layout.cell;
      p.moveTo(x, layout.oy);
      p.lineTo(x, layout.oy + layout.cell * gridH);
    }
    for (let gy = 0; gy <= gridH; gy++) {
      const y = layout.oy + gy * layout.cell;
      p.moveTo(layout.ox, y);
      p.lineTo(layout.ox + layout.cell * gridW, y);
    }
    return p;
  }, [showGrid, layout, gridW, gridH]);

  const boardPath = useMemo(() => {
    if (!boardSize || boardSize <= 0) return null;
    const p = Skia.Path.Make();
    const drawW = layout.cell * gridW;
    const drawH = layout.cell * gridH;
    for (let gx = boardSize; gx < gridW; gx += boardSize) {
      const x = layout.ox + gx * layout.cell;
      p.moveTo(x, layout.oy);
      p.lineTo(x, layout.oy + drawH);
    }
    for (let gy = boardSize; gy < gridH; gy += boardSize) {
      const y = layout.oy + gy * layout.cell;
      p.moveTo(layout.ox, y);
      p.lineTo(layout.ox + drawW, y);
    }
    return p;
  }, [boardSize, layout, gridW, gridH]);

  return (
    <Canvas style={{ width, height }}>
      <Group>
        {beads.map((b, i) => (
          <Rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.s}
            height={b.s}
            color={b.color}
          />
        ))}
      </Group>
      {gridPath && (
        <Path
          path={gridPath}
          style="stroke"
          strokeWidth={0.5}
          color={theme.colors.textFaint}
          opacity={0.35}
        />
      )}
      {boardPath && (
        <Path
          path={boardPath}
          style="stroke"
          strokeWidth={1.5}
          color={theme.colors.primaryDeep}
          opacity={0.55}
        />
      )}
    </Canvas>
  );
}
