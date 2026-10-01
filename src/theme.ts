// 设计系统：温暖手作风。奶油底 + 陶土橙主色 + 炭灰文字。

export const theme = {
  colors: {
    bg: '#F6F4EE',
    surface: '#FFFFFF',
    surfaceAlt: '#F1EDE4',
    border: '#E6E1D6',
    text: '#2B2823',
    textSoft: '#6F6A60',
    textFaint: '#A39E92',
    primary: '#E0704F',
    primaryDeep: '#C85A3B',
    primarySoft: '#FBE7DF',
    accent: '#7C9885',
    accentSoft: '#E4EDE7',
    warning: '#D9A441',
    dark: '#26231F',
    empty: '#ECE8DF',
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    pill: 999,
  },
  spacing: (n: number) => n * 4,
  shadow: {
    card: {
      shadowColor: '#3A342B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    float: {
      shadowColor: '#3A342B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 8,
    },
  },
  font: {
    display: 30,
    title: 22,
    h2: 17,
    body: 15,
    small: 13,
    tiny: 11,
  },
};

export type Theme = typeof theme;
