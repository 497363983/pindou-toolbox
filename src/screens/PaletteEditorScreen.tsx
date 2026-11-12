// 自定义色板编辑页：重命名、增删颜色（色号 + HEX）
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, SectionLabel } from '../components/ui';
import { hexToRgb } from '../core/palette';
import { usePaletteStore } from '../store/paletteStore';
import { theme } from '../theme';

export function PaletteEditorScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const paletteId: string = route.params?.paletteId;

  const custom = usePaletteStore((s) => s.custom);
  const renamePalette = usePaletteStore((s) => s.renamePalette);
  const addColor = usePaletteStore((s) => s.addColor);
  const removeColor = usePaletteStore((s) => s.removeColor);
  const deletePalette = usePaletteStore((s) => s.deletePalette);

  const palette = custom.find((p) => p.id === paletteId);

  const [name, setName] = useState(palette?.title ?? '');
  const [code, setCode] = useState('');
  const [hex, setHex] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const previewRgb = useMemo(() => hexToRgb(hex), [hex]);

  if (!palette) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.missing}>色板不存在或已被删除</Text>
        <Button title="返回" onPress={() => nav.goBack()} />
      </View>
    );
  }

  function handleAdd() {
    setErr(null);
    if (!code.trim()) {
      setErr('请填写色号');
      return;
    }
    if (!hexToRgb(hex)) {
      setErr('HEX 应为 6 位，如 E0704F');
      return;
    }
    const ok = addColor(palette!.id, code, hex.startsWith('#') ? hex : `#${hex}`);
    if (ok) {
      setCode('');
      setHex('');
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
        <Text style={styles.topTitle}>编辑色板</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <SectionLabel>色板名称</SectionLabel>
        <Card>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="给自定义色板起个名字"
            onEndEditing={() => name.trim() && renamePalette(palette.id, name.trim())}
          />
        </Card>

        <SectionLabel>添加颜色</SectionLabel>
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>色号</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="如 A1"
                autoCapitalize="characters"
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.fieldLabel}>HEX（不用填 #）</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={hex}
                  onChangeText={(t) => setHex(t.replace(/^#/, ''))}
                  placeholder="如 E0704F"
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: previewRgb ? hex : theme.colors.surfaceAlt },
                  ]}
                />
              </View>
            </View>
          </View>
          {err && <Text style={styles.err}>{err}</Text>}
          <Button title="添加颜色" icon="add-circle" onPress={handleAdd} />
        </Card>

        <SectionLabel>颜色列表（{palette.colors.length}）</SectionLabel>
        <Card style={{ paddingVertical: 6 }}>
          {palette.colors.length === 0 && (
            <Text style={styles.empty}>还没有颜色，先在上面添加</Text>
          )}
          {palette.colors.map((c, i) => (
            <View key={`${c.code}-${i}`} style={styles.colorRow}>
              <View style={[styles.dot, { backgroundColor: c.hex }]} />
              <Text style={styles.colorCode}>{c.code}</Text>
              <Text style={styles.colorHex}>{c.hex}</Text>
              <Ionicons
                name="trash-outline"
                size={19}
                color={theme.colors.primaryDeep}
                onPress={() => removeColor(palette.id, i)}
              />
            </View>
          ))}
        </Card>

        <View style={{ height: 20 }} />
        <Button
          title="删除整个色板"
          icon="trash"
          variant="ghost"
          onPress={() => {
            deletePalette(palette.id);
            nav.goBack();
          }}
        />
      </ScrollView>
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
  missing: { textAlign: 'center', marginVertical: 24, color: theme.colors.textSoft },
  field: { flex: 1 },
  fieldLabel: {
    fontSize: theme.font.tiny,
    color: theme.colors.textFaint,
    marginBottom: 6,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.font.body,
    color: theme.colors.text,
  },
  nameInput: {
    fontSize: theme.font.body,
    color: theme.colors.text,
    paddingVertical: 6,
  },
  swatch: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  err: { color: theme.colors.primaryDeep, fontSize: theme.font.small },
  empty: { color: theme.colors.textFaint, textAlign: 'center', paddingVertical: 16 },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.border },
  colorCode: { fontSize: theme.font.body, fontWeight: '700', color: theme.colors.text, minWidth: 48 },
  colorHex: { flex: 1, fontSize: theme.font.small, color: theme.colors.textSoft },
});
