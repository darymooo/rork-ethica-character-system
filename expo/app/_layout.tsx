import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Keyboard, Platform, TouchableWithoutFeedback } from "react-native";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { EthicaProvider, useEthica } from "@/contexts/EthicaContext";
import { RevenueCatProvider } from "@/contexts/RevenueCatContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.setOptions({
  duration: 220,
  fade: true,
});

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
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent = `button, [role="button"], a { touch-action: manipulation; -webkit-tap-highlight-color: transparent; } @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; } }`;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }
  }, []);

  useEffect(() => {
    const hideSplash = async () => {
      try {
        if (!isLoading && !hasHiddenSplash) {
          console.log("RootLayoutNav: hiding splash after app finished loading");
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false} touchSoundDisabled>
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackTitle: "Back",
          animation: Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
          animationDuration: 280,
          contentStyle: { backgroundColor: "#FBFAF6" },
        }}
      >
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
      <Stack.Screen name="paywall" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
      </Stack>
    </TouchableWithoutFeedback>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync("#FBFAF6");
  }, []);

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
