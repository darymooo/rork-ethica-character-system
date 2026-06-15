//
//  OnboardingView.swift
//  Ethica
//

import SwiftUI

private struct OnboardingScreen {
    let title: String
    let body: String
}

struct OnboardingView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var current = 0
    @State private var appeared = false

    private let screens: [OnboardingScreen] = [
        OnboardingScreen(
            title: "This is not a habit tracker.",
            body: "This system is based on Benjamin Franklin's method of character formation through observation."
        ),
        OnboardingScreen(
            title: "One virtue. One week.",
            body: "Focus on a single virtue each week.\nEach fault is marked, not judged."
        ),
        OnboardingScreen(
            title: "Perfection is not the goal.",
            body: "Observe honestly. Notice changes over time."
        )
    ]

    private var isLast: Bool { current == screens.count - 1 }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 32) {
                Spacer()

                VStack(spacing: 24) {
                    Text(screens[current].title)
                        .font(.system(size: FontSize.xlarge, weight: .bold))
                        .foregroundStyle(theme.text)
                        .multilineTextAlignment(.center)
                        .lineSpacing(6)

                    Text(screens[current].body)
                        .font(.system(size: FontSize.body))
                        .foregroundStyle(theme.textSecondary)
                        .multilineTextAlignment(.center)
                        .lineSpacing(6)
                        .frame(maxWidth: 520)
                }
                .padding(.horizontal, 8)
                .id(current)
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 24)

                if current == 1 {
                    weekGridDemo
                        .opacity(appeared ? 1 : 0)
                }

                Spacer()

                VStack(spacing: 32) {
                    HStack(spacing: 8) {
                        ForEach(screens.indices, id: \.self) { idx in
                            Circle()
                                .fill(idx == current ? theme.accent : theme.borderLight)
                                .frame(width: 8, height: 8)
                        }
                    }

                    OutlineButton(title: isLast ? "Begin" : "Continue", theme: theme) {
                        advance()
                    }
                }
            }
            .padding(.horizontal, 32)
            .padding(.vertical, 48)
            .frame(maxWidth: 600)
            .frame(maxWidth: .infinity)
        }
        .onAppear { animateIn() }
    }

    private var weekGridDemo: some View {
        HStack(spacing: 12) {
            let days = ["M", "T", "W", "T", "F", "S", "S"]
            ForEach(days.indices, id: \.self) { idx in
                VStack(spacing: 8) {
                    Text(days[idx])
                        .font(.system(size: FontSize.caption, weight: .medium))
                        .foregroundStyle(theme.textTertiary)
                    Rectangle()
                        .stroke(theme.borderLight, lineWidth: 1)
                        .frame(width: 36, height: 36)
                        .overlay {
                            if idx == 2 || idx == 5 {
                                Circle().fill(theme.faultDot).frame(width: 6, height: 6)
                            }
                        }
                }
            }
        }
        .padding(.vertical, 32)
    }

    private func animateIn() {
        appeared = false
        withAnimation(.easeOut(duration: 0.5)) { appeared = true }
    }

    private func advance() {
        if current < screens.count - 1 {
            withAnimation(.easeIn(duration: 0.18)) { appeared = false }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                current += 1
                animateIn()
            }
        } else {
            store.markOnboardingSeen()
            router.presentPaywall(.virtueSelection)
        }
    }
}
