//
//  ContentView.swift
//  Ethica
//
//  Root navigation + phase routing, mirroring expo-router's index/_layout flow.
//

import SwiftUI

struct RootView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(PurchaseStore.self) private var purchases
    @Environment(\.colorScheme) private var systemScheme

    @State private var router = AppRouter()

    private var isDark: Bool {
        store.state.followSystemTheme ? systemScheme == .dark : store.state.darkMode
    }
    private var theme: Theme { isDark ? .dark : .light }

    var body: some View {
        content
            .environment(\.theme, theme)
            .environment(router)
            .preferredColorScheme(store.state.followSystemTheme ? nil : (store.state.darkMode ? .dark : .light))
            .tint(theme.accent)
            .fullScreenCover(item: $router.paywall) { origin in
                PaywallView(origin: origin)
                    .environment(\.theme, theme)
            }
    }

    @ViewBuilder
    private var content: some View {
        if store.isLoading {
            SplashView()
        } else if !store.state.hasCompletedOnboarding && !store.state.hasSeenOnboarding {
            OnboardingView()
        } else {
            NavigationStack(path: $router.path) {
                Group {
                    if store.state.currentVirtueId == nil {
                        VirtueSelectionView()
                    } else {
                        HomeView()
                    }
                }
                .navigationBarBackButtonHidden(true)
                .toolbar(.hidden, for: .navigationBar)
                .navigationDestination(for: Route.self) { route in
                    destination(for: route)
                        .navigationBarBackButtonHidden(true)
                        .toolbar(.hidden, for: .navigationBar)
                }
            }
        }
    }

    @ViewBuilder
    private func destination(for route: Route) -> some View {
        switch route {
        case .settings: SettingsView()
        case .profile: ProfileView()
        case .analytics: AnalyticsView()
        case .journal: VirtueJournalView()
        case .personalJournal: PersonalJournalView()
        case .character: CharacterView()
        case .franklinMethod: FranklinMethodView()
        case .policies(let section): PoliciesView(initialSection: section)
        case .customVirtues: CustomVirtuesView()
        case .virtueQueue: VirtueQueueView()
        case .weekReview: WeekReviewView()
        }
    }
}

/// Lightweight branded launch state.
struct SplashView: View {
    var body: some View {
        ZStack {
            Color(hex: 0xE8DECC).ignoresSafeArea()
            VStack(spacing: 20) {
                Text("Ethica")
                    .font(.system(size: 40, weight: .bold, design: .serif))
                    .foregroundStyle(Color(hex: 0x1A1714))
                ProgressView()
                    .tint(Color(hex: 0x5B3F26))
            }
        }
    }
}
