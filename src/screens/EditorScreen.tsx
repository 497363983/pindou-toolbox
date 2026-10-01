// 编辑页：设置网格、板型、取色方式并生成图纸
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, SectionLabel, Segmented, Stepper } from '../components/ui';
import { getDefaultPalette } from '../core/palette';
import { convertToBeads } from '../core/quantize';
import { BOARDS, boardCountFor } from '../data/boards';
import { readImagePixels } from '../services/imagePixels';
import { useProjectStore, type Sampling } from '../store/projectStore';
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

  const board = BOARDS.find((b) => b.id === settings.boardId) ?? BOARDS[0];
  const usage = boardCountFor(settings.gridW, settings.gridH, board);
  const widthCm = ((settings.gridW * board.beadMm) / 10).toFixed(1);
  const heightCm = ((settings.gridH * board.beadMm) / 10).toFixed(1);

  function syncAspect() {
    if (sourceW && sourceH) {
      updateSettings({ gridH: Math.max(1, Math.round(settings.gridW * (sourceH / sourceW))) });
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const pixels = await readImagePixels(imageUri, settings.gridW, settings.gridH);
      const palette = getDefaultPalette();
      const pattern = convertToBeads(pixels, palette, {
        gridW: settings.gridW,
        gridH: settings.gridH,
        sampling: settings.sampling,
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
  summary: { marginTop: 16, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: theme.font.small, color: theme.colors.textSoft, marginLeft: 8 },
  error: { color: theme.colors.primaryDeep, marginTop: 12, textAlign: 'center' },
});
