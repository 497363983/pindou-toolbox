// web 版拼豆网格：浏览器 Canvas 2D 绘制每颗豆 + 网格 + 板边界
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import type { Palette } from '../core/palette';
import type { BeadPattern } from '../core/types';
import { theme } from '../theme';

interface Props {
  pattern: BeadPattern;
  palette: Palette;
  width: number;
  height: number;
  showGrid?: boolean;
  rounded?: boolean;
  boardSize?: number;
  onCellTap?: (gx: number, gy: number) => void;
  selected?: { gx: number; gy: number } | null;
}

export function BeadCanvas({
  pattern,
  palette,
  width,
  height,
  showGrid = true,
  rounded = true,
  boardSize,
  onCellTap,
  selected = null,
}: Props) {
  const hostRef = useRef<View | null>(null);

  useEffect(() => {
    const host = hostRef.current as unknown as HTMLElement | null;
    if (!host) return;
    host.innerHTML = '';

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.width = `${width}px`;
    cv.style.height = `${height}px`;
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
    const ctx = cv.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const { gridW, gridH, cells } = pattern;
    const cell = Math.min(width / gridW, height / gridH);
    const drawW = cell * gridW;
    const drawH = cell * gridH;
    const ox = (width - drawW) / 2;
    const oy = (height - drawH) / 2;
    const inset = rounded ? Math.max(0.5, cell * 0.12) : 0;
    const r = rounded ? Math.max(1, cell * 0.18) : 0;

    // 每颗豆
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const idx = cells[gy * gridW + gx];
        if (idx < 0) continue;
        const x = ox + gx * cell + inset;
        const y = oy + gy * cell + inset;
        const s = cell - inset * 2;
        ctx.fillStyle = palette.beads[idx].hex;
        if (r > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, s, s, r);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, s, s);
        }
      }
    }

    // 网格
    if (showGrid && cell >= 5) {
      ctx.strokeStyle = theme.colors.textFaint;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let gx = 0; gx <= gridW; gx++) {
        const x = ox + gx * cell;
        ctx.moveTo(x, oy);
        ctx.lineTo(x, oy + drawH);
      }
      for (let gy = 0; gy <= gridH; gy++) {
        const y = oy + gy * cell;
        ctx.moveTo(ox, y);
        ctx.lineTo(ox + drawW, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 板边界
    if (boardSize && boardSize > 0) {
      ctx.strokeStyle = theme.colors.primaryDeep;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let gx = boardSize; gx < gridW; gx += boardSize) {
        const x = ox + gx * cell;
        ctx.moveTo(x, oy);
        ctx.lineTo(x, oy + drawH);
      }
      for (let gy = boardSize; gy < gridH; gy += boardSize) {
        const y = oy + gy * cell;
        ctx.moveTo(ox, y);
        ctx.lineTo(ox + drawW, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 选中高亮
    if (selected) {
      const sx = ox + selected.gx * cell;
      const sy = oy + selected.gy * cell;
      ctx.strokeStyle = theme.colors.primary;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sx + 1, sy + 1, cell - 2, cell - 2);
    }

    // 点击命中
    function onClick(ev: MouseEvent) {
      if (!onCellTap) return;
      const rect = cv.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const gx = Math.floor((px - ox) / cell);
      const gy = Math.floor((py - oy) / cell);
      if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) onCellTap(gx, gy);
    }
    cv.addEventListener('click', onClick);

    host.appendChild(cv);
    return () => cv.removeEventListener('click', onClick);
  }, [pattern, palette, width, height, showGrid, rounded, boardSize, onCellTap, selected]);

  return <View ref={hostRef} style={{ width, height }} collapsable={false} />;
}
