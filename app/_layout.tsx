import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EthicaProvider, useEthica } from "@/contexts/EthicaContext";
import { RevenueCatProvider } from "@/contexts/RevenueCatContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const prepareSplash = async () => {
  try {
    await SplashScreen.preventAutoHideAsync();
  } catch (error) {
    console.error("Failed to prevent auto hide splash:", error);
  }
};

void prepareSplash();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading } = useEthica();
  const [hasHiddenSplash, setHasHiddenSplash] = useState<boolean>(false);

  useEffect(() => {
    console.log("RootLayoutNav: isLoading changed", { isLoading });
  }, [isLoading]);

  useEffect(() => {
    const forceHide = async () => {
      try {
        console.warn("RootLayoutNav: forcing splash hide after timeout");
        await SplashScreen.hideAsync();
        setHasHiddenSplash(true);
      } catch (error) {
        console.error("Failed to force hide splash:", error);
      }
    };

    const timeout = setTimeout(() => {
      void forceHide();
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const hideSplash = async () => {
      try {
        if (!isLoading && !hasHiddenSplash) {
          console.log("RootLayoutNav: hiding splash (data ready)");
          await SplashScreen.hideAsync();
          setHasHiddenSplash(true);
        }
      } catch (error) {
        console.error("Failed to hide splash:", error);
      }
    };

    void hideSplash();
  }, [hasHiddenSplash, isLoading]);

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
