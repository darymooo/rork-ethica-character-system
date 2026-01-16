import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EthicaProvider, useEthica } from "@/contexts/EthicaContext";
import { RevenueCatProvider } from "@/contexts/RevenueCatContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading } = useEthica();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="virtue-selection" />
      <Stack.Screen name="home" />
      <Stack.Screen name="log-observation" options={{ presentation: "modal" }} />
      <Stack.Screen name="week-review" />
      <Stack.Screen name="character" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="virtue-queue" />
      <Stack.Screen name="franklin-method" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="policies" />
      <Stack.Screen name="personal-journal" />
      <Stack.Screen name="custom-virtues" />
      <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <RevenueCatProvider>
            <EthicaProvider>
              <RootLayoutNav />
            </EthicaProvider>
          </RevenueCatProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
