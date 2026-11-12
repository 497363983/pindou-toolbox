// 首页：导入图片 + 历史作品
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../components/ui';
import { useProjectStore } from '../store/projectStore';
import { theme } from '../theme';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const projects = useProjectStore((s) => s.projects);
  const setImage = useProjectStore((s) => s.setImage);
  const loadProject = useProjectStore((s) => s.loadProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  async function pick(fromCamera: boolean) {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 1,
        });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setImage(a.uri, a.width, a.height);
    nav.navigate('Editor');
  }

  function openProject(p: (typeof projects)[number]) {
    loadProject(p);
    nav.navigate('Result');
  }

  // web 端：直接载入示例图，绕过系统文件选择器（便于功能验证）
  async function loadSample() {
    try {
      const resp = await fetch('/test-img.png');
      const blob = await resp.blob();
      const dataUrl: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      await new Promise<void>((resolve) => {
        const im = new (window as any).Image();
        im.onload = () => {
          setImage(dataUrl, im.width, im.height);
          resolve();
        };
        im.src = dataUrl;
      });
      (window as any).__sampleStage = 'navigating';
      nav.navigate('Editor');
      (window as any).__sampleStage = 'navigated';
    } catch (e: any) {
      (window as any).__sampleErr = String(e && e.stack ? e.stack : e);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>拼豆图纸</Text>
          <Text style={styles.sub}>把任意照片变成可拼的豆色图纸</Text>
        </View>

        <Card style={styles.importCard}>
          <View style={styles.importIcon}>
            <Ionicons name="grid" size={26} color={theme.colors.primary} />
          </View>
          <Text style={styles.importTitle}>开始新作品</Text>
          <Text style={styles.importDesc}>
            选择一张照片，自动匹配真实豆色号并统计用料
          </Text>
          <View style={{ height: 12 }} />
          <Button title="从相册选择" icon="images" full onPress={() => pick(false)} />
          <View style={{ height: 10 }} />
          {Platform.OS === 'web' && (
            <>
              <Button title="使用示例图片" icon="sparkles" variant="ghost" full onPress={loadSample} />
              <View style={{ height: 10 }} />
            </>
          )}
          <Button
            title="拍照"
            icon="camera"
            variant="secondary"
            full
            onPress={() => pick(true)}
          />
        </Card>

        {projects.length > 0 && (
          <>
            <Text style={styles.recentTitle}>我的作品（{projects.length}）</Text>
            {projects.map((p) => (
              <Card key={p.id} style={styles.projectCard}>
                <PressableProject onPress={() => openProject(p)}>
                  <Image source={{ uri: p.imageUri }} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.pMeta}>
                      {p.gridW}×{p.gridH} · {p.totalBeads}颗 · {p.colorCount}色
                    </Text>
                  </View>
                </PressableProject>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.colors.textFaint}
                  onPress={() => deleteProject(p.id)}
                  style={{ padding: 6 }}
                />
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PressableProject({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { marginBottom: 18, paddingHorizontal: 4 },
  logo: { fontSize: theme.font.display, fontWeight: '800', color: theme.colors.text },
  sub: { fontSize: theme.font.body, color: theme.colors.textSoft, marginTop: 4 },
  importCard: { alignItems: 'flex-start' },
  importIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  importTitle: { fontSize: theme.font.title, fontWeight: '700', color: theme.colors.text },
  importDesc: { fontSize: theme.font.small, color: theme.colors.textSoft, lineHeight: 20 },
  recentTitle: {
    fontSize: theme.font.small,
    fontWeight: '700',
    color: theme.colors.textFaint,
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 4,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: theme.colors.empty,
  },
  pName: { fontSize: theme.font.h2, fontWeight: '600', color: theme.colors.text },
  pMeta: { fontSize: theme.font.tiny, color: theme.colors.textFaint, marginTop: 3 },
});
