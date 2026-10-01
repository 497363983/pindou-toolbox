// 通用 UI 组件
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

interface BtnProps {
  title: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
}

export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  full,
}: BtnProps) {
  const v = styles[`btn_${variant}`];
  const t = styles[`btnText_${variant}`];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        v,
        full && { alignSelf: 'stretch' },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.colors.primary} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'primary' ? '#fff' : theme.colors.primary}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[styles.btnText, t]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Stepper({
  label,
  value,
  onChange,
  min = 1,
  max = 300,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <View style={styles.stepperRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepperLabel}>{label}</Text>
        {hint ? <Text style={styles.stepperHint}>{hint}</Text> : null}
      </View>
      <Pressable
        onPress={() => onChange(clamp(value - step))}
        style={styles.stepperBtn}
        hitSlop={8}
      >
        <Ionicons name="remove" size={18} color={theme.colors.text} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        onPress={() => onChange(clamp(value + step))}
        style={styles.stepperBtn}
        hitSlop={8}
      >
        <Ionicons name="add" size={18} color={theme.colors.text} />
      </Pressable>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmentWrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: theme.radius.pill,
  },
  btn_primary: { backgroundColor: theme.colors.primary },
  btn_secondary: {
    backgroundColor: theme.colors.primarySoft,
  },
  btn_ghost: { backgroundColor: 'transparent' },
  btnText: { fontSize: theme.font.body, fontWeight: '600' },
  btnText_primary: { color: '#fff' },
  btnText_secondary: { color: theme.colors.primaryDeep },
  btnText_ghost: { color: theme.colors.textSoft },
  sectionLabel: {
    fontSize: theme.font.small,
    fontWeight: '700',
    color: theme.colors.textFaint,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepperLabel: { fontSize: theme.font.body, color: theme.colors.text, fontWeight: '500' },
  stepperHint: { fontSize: theme.font.tiny, color: theme.colors.textFaint, marginTop: 2 },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 44,
    textAlign: 'center',
    fontSize: theme.font.h2,
    fontWeight: '700',
    color: theme.colors.text,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.pill,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: theme.colors.surface, ...theme.shadow.card },
  segmentText: { fontSize: theme.font.small, color: theme.colors.textSoft, fontWeight: '600' },
  segmentTextActive: { color: theme.colors.primaryDeep },
});
