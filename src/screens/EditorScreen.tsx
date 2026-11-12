// 编辑页：设置网格、板型、取色方式并生成图纸
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, SectionLabel, Segmented, Stepper } from '../components/ui';
import { getPaletteById, usePaletteList } from '../core/paletteRegistry';
import { convertToBeads } from '../core/quantize';
import { BOARDS, boardCountFor } from '../data/boards';
import { BUILTIN_PALETTES } from '../data/palettes';
import { readImagePixels } from '../services/imagePixels';
import { usePaletteStore } from '../store/paletteStore';
import { useProjectStore, type Dither, type Sampling } from '../store/projectStore';
import { theme } from '../theme';

export function EditorScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUri = useProjectStore((s) => s.imageUri)!;
  const sourceW = useProjectStore((s) => s.sourceW);
  const sourceH = useProjectStore((s) => s.sourceH);
  const settings = useProjectStore((s) => s.settings);
  const updateSettings = useProjectStore((s) => s.updateSettings);
  const setPattern = useProjectStore((s) => s.setPattern);
  const paletteId = useProjectStore((s) => s.paletteId);
  const setPaletteId = useProjectStore((s) => s.setPaletteId);
  const paletteList = usePaletteList();
  const createPalette = usePaletteStore((s) => s.createPalette);
  const duplicateBuiltin = usePaletteStore((s) => s.duplicateBuiltin);

  const board = BOARDS.find((b) => b.id === settings.boardId) ?? BOARDS[0];
  const usage = boardCountFor(settings.gridW, settings.gridH, board);
  const widthCm = ((settings.gridW * board.beadMm) / 10).toFixed(1);
  const heightCm = ((settings.gridH * board.beadMm) / 10).toFixed(1);

  // web 临时钩子：直接改设置
  useEffect(() => {
    (window as any).__set = (o: any) => updateSettings(o);
  }, [updateSettings]);

  function syncAspect() {
    if (sourceW && sourceH) {
      updateSettings({ gridH: Math.max(1, Math.round(settings.gridW * (sourceH / sourceW))) });
    }
  }

  function newCustomPalette() {
    const id = createPalette('我的色板');
    setPaletteId(id);
    nav.navigate('PaletteEditor', { paletteId: id });
  }

  function copyBuiltin(id: string) {
    const def = BUILTIN_PALETTES.find((b) => b.raw.id === id);
    if (!def) return;
    const newId = duplicateBuiltin(def.raw, `${def.raw.title}（副本）`);
    setPaletteId(newId);
    nav.navigate('PaletteEditor', { paletteId: newId });
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const pixels = await readImagePixels(imageUri, settings.gridW, settings.gridH);
      const palette = getPaletteById(paletteId);
      const pattern = convertToBeads(pixels, palette, {
        gridW: settings.gridW,
        gridH: settings.gridH,
        sampling: settings.sampling,
        dither: settings.dither,
      });
      setPattern(pattern);
      nav.navigate('Result');
    } catch (e: any) {
      setError(e?.message ?? '生成失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Ionicons
          name="chevron-back"
          size={26}
          color={theme.colors.text}
          onPress={() => nav.goBack()}
        />
        <Text style={styles.topTitle}>设置</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Card style={{ padding: 12, alignItems: 'center' }}>
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
            resizeMode="contain"
          />
        </Card>

        <SectionLabel>成品网格（每格 = 1 颗豆）</SectionLabel>
        <Card>
          <Stepper
            label="宽度（格）"
            value={settings.gridW}
            onChange={(v) => updateSettings({ gridW: v })}
            min={8}
            max={200}
          />
          <Stepper
            label="高度（格）"
            value={settings.gridH}
            onChange={(v) => updateSettings({ gridH: v })}
            min={8}
            max={200}
          />
          <Button title="按原图比例" icon="link" variant="ghost" onPress={syncAspect} />
        </Card>

        <SectionLabel>豆色标准（品牌色板）</SectionLabel>
        <Card style={{ paddingVertical: 6 }}>
          {paletteList.map((p) => {
            const active = p.id === paletteId;
            return (
              <View key={p.id} style={styles.paletteRow}>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={active ? theme.colors.primary : theme.colors.textFaint}
                />
                <Pressable
                  style={{ flex: 1, justifyContent: 'center' }}
                  onPress={() => setPaletteId(p.id)}
                >
                  <Text
                    style={[styles.paletteName, active && { color: theme.colors.primaryDeep }]}
                  >
                    {p.brand} · {p.title}
                  </Text>
                  <Text style={styles.paletteSub}>
                    {p.custom ? `${p.count} 色 · 自定义` : p.note}
                  </Text>
                </Pressable>
                {p.custom ? (
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={theme.colors.primary}
                    onPress={() => nav.navigate('PaletteEditor', { paletteId: p.id })}
                  />
                ) : (
                  <Ionicons
                    name="copy-outline"
                    size={19}
                    color={theme.colors.textFaint}
                    onPress={() => copyBuiltin(p.id)}
                  />
                )}
              </View>
            );
          })}
        </Card>
        <Button
          title="新建自定义色板"
          icon="color-palette"
          variant="ghost"
          onPress={newCustomPalette}
        />

        <SectionLabel>取色方式</SectionLabel>
        <Card style={{ paddingVertical: 10 }}>
          <Segmented<Sampling>
            value={settings.sampling}
            onChange={(v) => updateSettings({ sampling: v })}
            options={[
              { value: 'dominant', label: '主导色（清晰）' },
              { value: 'average', label: '平均色（柔和）' },
            ]}
          />
        </Card>

        <SectionLabel>色彩还原（抖动）</SectionLabel>
        <Card style={{ paddingVertical: 10 }}>
          <Segmented<Dither>
            value={settings.dither}
            onChange={(v) => updateSettings({ dither: v })}
            options={[
              { value: 'floyd', label: '抖动（更还原）' },
              { value: 'none', label: '关闭（色块干净）' },
            ]}
          />
        </Card>

        <SectionLabel>拼豆板型</SectionLabel>
        <Card style={{ paddingVertical: 8 }}>
          {BOARDS.map((b) => {
            const active = b.id === settings.boardId;
            return (
              <View key={b.id} style={styles.boardRow}>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={active ? theme.colors.primary : theme.colors.textFaint}
                />
                <Text
                  style={[styles.boardName, active && { color: theme.colors.primaryDeep }]}
                  onPress={() => updateSettings({ boardId: b.id })}
                >
                  {b.name}
                </Text>
              </View>
            );
          })}
        </Card>

        <Card style={styles.summary}>
          <Info icon="crop" label={`成品尺寸：约 ${widthCm} × ${heightCm} cm`} />
          <Info
            icon="grid-outline"
            label={`需要 ${board.name}：${usage.cols}×${usage.rows} 共 ${usage.total} 块`}
          />
        </Card>

        {error && <Text style={styles.error}>{error}</Text>}
        <View style={{ height: 14 }} />
        <Button title="生成图纸" icon="sparkles" full loading={busy} onPress={generate} />
      </ScrollView>
    </View>
  );
}

function Info({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={17} color={theme.colors.accent} />
      <Text style={styles.infoText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topTitle: { fontSize: theme.font.h2, fontWeight: '700', color: theme.colors.text },
  preview: { width: '100%', height: 220, borderRadius: theme.radius.md },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  boardName: { fontSize: theme.font.body, color: theme.colors.text, marginLeft: 10, flex: 1 },
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  paletteName: { fontSize: theme.font.body, color: theme.colors.text, fontWeight: '600' },
  paletteSub: { fontSize: theme.font.tiny, color: theme.colors.textFaint, marginTop: 2 },
  summary: { marginTop: 16, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: theme.font.small, color: theme.colors.textSoft, marginLeft: 8 },
  error: { color: theme.colors.primaryDeep, marginTop: 12, textAlign: 'center' },
});
