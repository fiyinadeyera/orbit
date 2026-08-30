import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';
import { useColors } from '@/hooks/useColors';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBaseUrl } from '@workspace/api-client-react';

// Every request the generated API hooks make goes through this base URL, so
// this app talks to the same Orbit API server the web app already uses.
// Local dev sets EXPO_PUBLIC_API_URL directly (e.g. http://localhost:5001 in the
// iOS Simulator, or http://<mac-lan-ip>:5001 on a physical phone). On Replit,
// that var is unset and we fall back to the injected https domain.
setBaseUrl(
  process.env.EXPO_PUBLIC_API_URL ??
    `https://${process.env.EXPO_PUBLIC_DOMAIN}`,
);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', color: colors.foreground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="person/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="person-form"
        options={{
          headerShown: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.94],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen name="import" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen
        name="import-contacts"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="import-google"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="import-linkedin"
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <ToastProvider>
                <RootLayoutNav />
              </ToastProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
