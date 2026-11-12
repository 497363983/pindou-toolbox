import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EditorScreen } from './src/screens/EditorScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PaletteEditorScreen } from './src/screens/PaletteEditorScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { ensureSkia } from './src/services/skiaInit';
import { ensureCjkFont } from './src/services/cjkFont';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [skiaReady, setSkiaReady] = useState(false);

  useEffect(() => {
    Promise.all([ensureSkia(), ensureCjkFont()]).then(() =>
      setSkiaReady(true),
    );
  }, []);

  if (!skiaReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: theme.colors.textSoft }}>正在加载拼豆引擎…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Editor" component={EditorScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="PaletteEditor" component={PaletteEditorScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
