// 自定义色板：持久化到 AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RawPalette } from '../data/palettes';
import { hexToRgb } from '../core/palette';

export type CustomColor = RawPalette['colors'][number];

interface PaletteState {
  custom: RawPalette[];

  /** 新建空白自定义色板，返回 id */
  createPalette: (title: string) => string;
  /** 复制内置色板为自定义，返回 id */
  duplicateBuiltin: (raw: RawPalette, title: string) => string;
  deletePalette: (id: string) => void;
  renamePalette: (id: string, title: string) => void;
  addColor: (id: string, code: string, hex: string) => boolean;
  updateColor: (id: string, index: number, code: string, hex: string) => void;
  removeColor: (id: string, index: number) => void;
}

function toColor(code: string, hex: string): CustomColor | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const group = code.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() ?? 'X';
  return {
    code: code.trim(),
    hex: hex.toUpperCase(),
    rgb: [rgb.r, rgb.g, rgb.b],
    group,
  };
}

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set, get) => ({
      custom: [],

      createPalette: (title) => {
        const id = `custom-${Date.now()}`;
        set((s) => ({
          custom: [
            ...s.custom,
            { id, title: title || '自定义色板', count: 0, colors: [] },
          ],
        }));
        return id;
      },

      duplicateBuiltin: (raw, title) => {
        const id = `custom-${Date.now()}`;
        const colors = raw.colors.map((c) => ({ ...c }));
        set((s) => ({
          custom: [
            ...s.custom,
            { id, title: title || `${raw.title}（自定义）`, count: colors.length, colors },
          ],
        }));
        return id;
      },

      deletePalette: (id) =>
        set((s) => ({ custom: s.custom.filter((p) => p.id !== id) })),

      renamePalette: (id, title) =>
        set((s) => ({
          custom: s.custom.map((p) => (p.id === id ? { ...p, title } : p)),
        })),

      addColor: (id, code, hex) => {
        const c = toColor(code, hex);
        if (!c) return false;
        let ok = false;
        set((s) => ({
          custom: s.custom.map((p) => {
            if (p.id !== id) return p;
            ok = true;
            const colors = [...p.colors, c];
            return { ...p, colors, count: colors.length };
          }),
        }));
        return ok;
      },

      updateColor: (id, index, code, hex) => {
        const c = toColor(code, hex);
        if (!c) return;
        set((s) => ({
          custom: s.custom.map((p) => {
            if (p.id !== id) return p;
            const colors = p.colors.map((x, i) => (i === index ? c : x));
            return { ...p, colors };
          }),
        }));
      },

      removeColor: (id, index) =>
        set((s) => ({
          custom: s.custom.map((p) => {
            if (p.id !== id) return p;
            const colors = p.colors.filter((_, i) => i !== index);
            return { ...p, colors, count: colors.length };
          }),
        })),
    }),
    {
      name: 'pindou-custom-palettes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ custom: s.custom }),
    },
  ),
);
