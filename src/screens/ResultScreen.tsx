// 结果页：效果预览 / 施工图纸 / 用料清单 + 保存导出
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Dimensions, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, SectionLabel, Segmented } from '../components/ui';
// 按平台加载：web 用 Canvas2D 版本，原生用 Skia 版本
const { BeadCanvas } = Platform.select({
  web: () => require('../components/BeadCanvas.web'),
  default: () => require('../components/BeadCanvas'),
})!() as typeof import('../components/BeadCanvas');
import { getPaletteById } from '../core/paletteRegistry';
import { BOARDS } from '../data/boards';
import { saveToGallery, shareImage } from '../services/export';
import { renderPatternToFile } from '../services/renderPattern';
import { useProjectStore } from '../store/projectStore';
import { theme } from '../theme';

type Tab = 'preview' | 'chart' | 'materials';

export function ResultScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('chart');
  const [chartUri, setChartUri] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<{ gx: number; gy: number } | null>(null);

  const pattern = useProjectStore((s) => s.pattern)!;
  const settings = useProjectStore((s) => s.settings);
  const paletteId = useProjectStore((s) => s.paletteId);
  const saveProject = useProjectStore((s) => s.saveProject);
  const paintCell = useProjectStore((s) => s.paintCell);

  const palette = useMemo(() => getPaletteById(paletteId), [paletteId]);
  const board = BOARDS.find((b) => b.id === settings.boardId) ?? BOARDS[0];

  const materials = useMemo(() => {
    return [...pattern.counts.entries()]
      .map(([idx, n]) => ({ bead: palette.beads[idx], n }))
      .sort((a, b) => b.n - a.n);
  }, [pattern, palette]);

  useEffect(() => {
    if (tab === 'chart') {
      setChartUri(renderPatternToFile(pattern, palette, 'chart', board.width));
    } else if (tab === 'preview') {
      setPreviewUri(renderPatternToFile(pattern, palette, 'preview', board.width));
    }
  }, [tab, pattern, palette, board]);

  function chooseColor(idx: number) {
    if (!selected) {
      flash('请先点选要修改的格子');
      return;
    }
    paintCell(selected.gx, selected.gy, idx);
  }

  // web 临时调试钩子：导出高清效果图/图纸
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    (window as any).__hiRes = () =>
      renderPatternToFile(pattern, palette, 'preview', board.width);
    (window as any).__chartHiRes = () =>
      renderPatternToFile(pattern, palette, 'chart', board.width);
  }, [pattern, palette, board]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function handleSave() {
    const saved = saveProject(`${pattern.gridW}x${pattern.gridH} 作品`);
    flash(saved ? '已保存到我的作品' : '保存失败');
  }

  async function exportChart() {
    const uri = chartUri ?? renderPatternToFile(pattern, palette, 'chart', board.width);
    const ok = await saveToGallery(uri);
    flash(ok ? '施工图纸已导出' : '未获得相册权限');
  }

  async function shareChart() {
    const uri = chartUri ?? renderPatternToFile(pattern, palette, 'chart', board.width);
    const ok = await shareImage(uri);
    if (!ok) flash('当前设备不支持分享');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Ionicons name="chevron-back" size={26} color={theme.colors.text} onPress={() => nav.goBack()} />
        <Text style={styles.topTitle}>我的图纸</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ paddingHorizontal: 18 }}>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'preview', label: '效果' },
            { value: 'chart', label: '图纸' },
            { value: 'materials', label: '用料' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Card style={styles.stage}>
          {tab === 'preview' && (
            <BeadCanvas
              pattern={pattern}
              palette={palette}
              width={stageSize}
              height={stageSize}
              boardSize={board.width}
            />
          )}
          {tab === 'chart' &&
            (editing ? (
              <BeadCanvas
                pattern={pattern}
                palette={palette}
                width={stageSize}
                height={stageSize}
                boardSize={board.width}
                rounded={false}
                selected={selected}
                onCellTap={(gx, gy) => setSelected({ gx, gy })}
              />
            ) : chartUri ? (
              <Image
                source={{ uri: chartUri }}
                style={{ width: '100%', height: 460 }}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.loading}>正在生成施工图纸…</Text>
            ))}
          {tab === 'materials' && (
            <View>
              <View style={styles.matHead}>
                <Text style={styles.matTotal}>共 {pattern.totalBeads} 颗</Text>
                <Text style={styles.matTotal}>{pattern.colorCount} 种色</Text>
              </View>
              {materials.map((m) => (
                <View key={m.bead.code} style={styles.matRow}>
                  <View style={[styles.swatch, { backgroundColor: m.bead.hex }]} />
                  <Text style={styles.matCode}>{m.bead.code}</Text>
                  <Text style={styles.matN}>{m.n}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {tab === 'chart' && (
          <Text style={styles.tip}>深色粗线为拼豆板边界，可据此分板拼制</Text>
        )}

        {tab === 'chart' && (
          <>
            <View style={{ height: 12 }} />
            <Button
              title={editing ? '完成编辑' : '编辑格点颜色'}
              icon={editing ? 'checkmark' : 'color-palette'}
              variant={editing ? 'secondary' : 'ghost'}
              full
              onPress={() => {
                setEditing((e) => !e);
                setSelected(null);
              }}
            />
            {editing && (
              <Card style={{ marginTop: 12, paddingVertical: 10 }}>
                <Text style={styles.editHint}>
                  {selected
                    ? `已选 第${selected.gy + 1}行 第${selected.gx + 1}列，点下方颜色替换`
                    : '先在上方点选要修改的格子'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={styles.swatchBar}>
                    <ColorChip hex="#F6F4EE" label="擦除" onPress={() => chooseColor(-1)} />
                    {palette.beads.map((b, i) => (
                      <ColorChip key={b.code} hex={b.hex} label={b.code} onPress={() => chooseColor(i)} />
                    ))}
                  </View>
                </ScrollView>
              </Card>
            )}
          </>
        )}

        <SectionLabel>操作</SectionLabel>
        <Button title="保存到我的作品" icon="bookmark" full onPress={handleSave} />
        <View style={{ height: 10 }} />
        <Button title="导出施工图纸到相册" icon="download" variant="secondary" full onPress={exportChart} />
        <View style={{ height: 10 }} />
        <Button title="分享图纸" icon="share-social" variant="ghost" full onPress={shareChart} />
      </ScrollView>

      {toast && (
        <View style={[styles.toast, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

function ColorChip({ hex, label, onPress }: { hex: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <View style={[styles.chipSwatch, { backgroundColor: hex }]} />
      <Text style={styles.chipLabel}>{label}</Text>
    </Pressable>
  );
}

const stageSize = Math.min(Dimensions.get('window').width - 68, 380);

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
  stage: { padding: 8, minHeight: 340, justifyContent: 'center' },
  loading: { textAlign: 'center', color: theme.colors.textFaint, paddingVertical: 60 },
  tip: { fontSize: theme.font.tiny, color: theme.colors.textFaint, textAlign: 'center', marginTop: 10 },
  matHead: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4 },
  matTotal: { fontSize: theme.font.h2, fontWeight: '700', color: theme.colors.primaryDeep },
  matRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  swatch: { width: 26, height: 26, borderRadius: 7, marginRight: 12, borderWidth: 1, borderColor: theme.colors.border },
  matCode: { flex: 1, fontSize: theme.font.body, color: theme.colors.text, fontWeight: '500' },
  matN: { fontSize: theme.font.h2, fontWeight: '700', color: theme.colors.text },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: theme.colors.dark, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  toastText: { color: '#fff', fontSize: theme.font.small },
  editHint: { fontSize: theme.font.small, color: theme.colors.textSoft, textAlign: 'center', paddingHorizontal: 8 },
  swatchBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingVertical: 4 },
  chip: { alignItems: 'center', width: 52 },
  chipSwatch: { width: 44, height: 44, borderRadius: 9, borderWidth: 1, borderColor: theme.colors.border },
  chipLabel: { fontSize: 11, color: theme.colors.textSoft, marginTop: 4 },
});
