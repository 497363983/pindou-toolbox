// 项目状态：当前会话 + 持久化的历史项目
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BeadPattern } from '../core/types';

export type Sampling = 'dominant' | 'average';

export interface Settings {
  gridW: number;
  gridH: number;
  boardId: string;
  sampling: Sampling;
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: number;
  imageUri: string;
  paletteId: string;
  gridW: number;
  gridH: number;
  boardId: string;
  sampling: Sampling;
  cells: number[];
  counts: [number, number][];
  totalBeads: number;
  colorCount: number;
}

interface ProjectState {
  imageUri: string | null;
  sourceW: number;
  sourceH: number;
  settings: Settings;
  pattern: BeadPattern | null;
  paletteId: string;
  projects: SavedProject[];

  setImage: (uri: string, w: number, h: number) => void;
  updateSettings: (p: Partial<Settings>) => void;
  setPattern: (p: BeadPattern) => void;
  saveProject: (name: string) => SavedProject | null;
  deleteProject: (id: string) => void;
  loadProject: (p: SavedProject) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  gridW: 29,
  gridH: 29,
  boardId: 'b29',
  sampling: 'dominant',
};

function patternToSaved(
  p: BeadPattern,
  meta: Omit<SavedProject, 'id' | 'createdAt' | 'cells' | 'counts' | 'totalBeads' | 'colorCount'>,
): SavedProject {
  return {
    ...meta,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    cells: Array.from(p.cells),
    counts: [...p.counts.entries()],
    totalBeads: p.totalBeads,
    colorCount: p.colorCount,
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      imageUri: null,
      sourceW: 0,
      sourceH: 0,
      settings: DEFAULT_SETTINGS,
      pattern: null,
      paletteId: 'mard-221-alfonse-doudou',
      projects: [],

      setImage: (uri, w, h) =>
        set({ imageUri: uri, sourceW: w, sourceH: h, pattern: null }),

      updateSettings: (p) =>
        set((s) => ({ settings: { ...s.settings, ...p } })),

      setPattern: (pattern) => set({ pattern }),

      saveProject: (name) => {
        const { pattern, imageUri, settings, paletteId } = get();
        if (!pattern || !imageUri) return null;
        const saved = patternToSaved(pattern, {
          name: name || '未命名作品',
          imageUri,
          paletteId,
          gridW: settings.gridW,
          gridH: settings.gridH,
          boardId: settings.boardId,
          sampling: settings.sampling,
        });
        set((s) => ({ projects: [saved, ...s.projects] }));
        return saved;
      },

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      loadProject: (p) =>
        set({
          imageUri: p.imageUri,
          paletteId: p.paletteId,
          settings: {
            gridW: p.gridW,
            gridH: p.gridH,
            boardId: p.boardId,
            sampling: p.sampling,
          },
          pattern: {
            gridW: p.gridW,
            gridH: p.gridH,
            cells: new Int32Array(p.cells),
            counts: new Map(p.counts),
            totalBeads: p.totalBeads,
            colorCount: p.colorCount,
          },
        }),

      reset: () =>
        set({
          imageUri: null,
          sourceW: 0,
          sourceH: 0,
          settings: DEFAULT_SETTINGS,
          pattern: null,
        }),
    }),
    {
      name: 'pindou-projects',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ projects: s.projects }),
    },
  ),
);
