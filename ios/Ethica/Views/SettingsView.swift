//
//  SettingsView.swift
//  Ethica
//

import SwiftUI

struct SettingsView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(PurchaseStore.self) private var purchases
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var showResetAlert = false
    @State private var showDeleteAlert = false
    @State private var showExportInfo = false

    private var isPro: Bool { purchases.isPro }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Settings", theme: theme) { router.pop() }
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        preferencesSection
                        appearanceSection
                        dataSection
                        if !isPro { upgradeCard } else { subscriptionSection }
                        aboutSection
                        dangerSection
                        footer
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 40)
                    .frame(maxWidth: 760)
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .alert("Reset Character History", isPresented: $showResetAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Reset", role: .destructive) {
                Haptics.warning(); store.resetData(); router.popToRoot()
            }
        } message: { Text("Are you sure you want to reset all character history? This action cannot be undone.") }
        .alert("Delete Account", isPresented: $showDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete Account", role: .destructive) {
                Haptics.warning(); store.resetData(); router.popToRoot()
            }
        } message: { Text("This will permanently delete all virtue tracking data, weekly observations and notes, custom virtues, and app settings. This action cannot be undone.") }
        .alert("Premium Feature", isPresented: $showExportInfo) {
            Button("Cancel", role: .cancel) {}
            Button("Upgrade") { router.presentPaywall(.settings) }
        } message: { Text("Journal export is available in Ethica Pro. Upgrade to export your complete character record.") }
    }

    // MARK: Sections

    private var preferencesSection: some View {
        section(title: "PREFERENCES") {
            toggleRow(icon: "calendar", label: "Week starts on Monday", isOn: store.state.weekStartsMonday, isLast: true) {
                store.updatePreferences(weekStartsMonday: !store.state.weekStartsMonday)
            }
        }
    }

    private var appearanceSection: some View {
        section(title: "APPEARANCE") {
            toggleRow(icon: "sun.max", label: "Follow system", isOn: store.state.followSystemTheme) {
                store.updatePreferences(followSystemTheme: !store.state.followSystemTheme)
            }
            divider
            toggleRow(icon: "moon", label: "Dark mode", isOn: store.state.darkMode && !store.state.followSystemTheme, disabled: store.state.followSystemTheme, isLast: true) {
                if !store.state.followSystemTheme { store.updatePreferences(darkMode: !store.state.darkMode) }
            }
        }
    }

    private var dataSection: some View {
        section(title: "DATA & PLANNING") {
            navRow(icon: "pencil", label: "Custom virtues", sublabel: isPro ? "Manage your custom virtues" : "Create your own principles") {
                router.push(.customVirtues)
            }
            divider
            navRow(icon: "square.and.arrow.down", label: "Export character record", sublabel: "Download your progress data") {
                if isPro { showExportInfo = true } else { showExportInfo = true }
            }
            divider
            navRow(icon: "list.number", label: "Virtue queue", sublabel: "Plan your upcoming cycle", isLast: true) {
                if isPro { router.push(.virtueQueue) } else { router.presentPaywall(.settings) }
            }
        }
    }

    private var upgradeCard: some View {
        Button { router.presentPaywall(.settings) } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(theme.accent.opacity(0.12)).frame(width: 48, height: 48)
                    Image(systemName: "sparkles").font(.system(size: 24)).foregroundStyle(theme.accent)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Upgrade to Ethica Pro").font(.system(size: 16, weight: .semibold)).foregroundStyle(theme.text)
                    Text("Unlock custom virtues, advanced analytics, and more").font(.system(size: 13)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.leading)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 16)).foregroundStyle(theme.textTertiary)
            }
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface))
        }
        .buttonStyle(PressableStyle())
    }

    private var subscriptionSection: some View {
        section(title: "SUBSCRIPTION") {
            navRow(icon: "sparkles", label: "Ethica Pro", sublabel: "Manage your subscription", isLast: true) {
                router.presentPaywall(.settings)
            }
        }
    }

    private var aboutSection: some View {
        section(title: "ABOUT") {
            navRow(icon: "book", label: "Franklin's method", sublabel: "Learn about the philosophy") {
                router.push(.franklinMethod)
            }
            divider
            navRow(icon: "shield", label: "Privacy & Terms", sublabel: nil, isLast: true) {
                router.push(.policies(section: .privacy))
            }
        }
    }

    private var dangerSection: some View {
        section(title: "DANGER ZONE") {
            navRow(icon: "arrow.counterclockwise", label: "Delete account", sublabel: "Permanently delete all your data", destructive: true) {
                Haptics.medium(); showDeleteAlert = true
            }
            divider
            navRow(icon: "arrow.counterclockwise", label: "Reset all data", sublabel: "This cannot be undone", destructive: true, isLast: true) {
                Haptics.medium(); showResetAlert = true
            }
        }
    }

    private var footer: some View {
        VStack(spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "info.circle").font(.system(size: 16)).foregroundStyle(theme.textTertiary)
                Text("Based on Benjamin Franklin's method of character formation through disciplined daily observation.")
                    .font(.system(size: 13)).foregroundStyle(theme.textSecondary).lineSpacing(2)
                Spacer(minLength: 0)
            }
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface))
            Text("Ethica · Version 1.0.0").font(.system(size: 12)).foregroundStyle(theme.textTertiary)
        }
        .padding(.top, 32)
    }

    // MARK: Building blocks

    private func section<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: title, theme: theme).padding(.leading, 16)
            VStack(spacing: 0) { content() }
                .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private var divider: some View {
        Rectangle().fill(theme.borderLight).frame(height: 1).padding(.leading, 60)
    }

    private func toggleRow(icon: String, label: String, isOn: Bool, disabled: Bool = false, isLast: Bool = false, action: @escaping () -> Void) -> some View {
        HStack(spacing: 12) {
            iconBox(icon, destructive: false)
            Text(label).font(.system(size: 15, weight: .medium)).foregroundStyle(theme.text).opacity(disabled ? 0.5 : 1)
            Spacer()
            Toggle("", isOn: Binding(get: { isOn }, set: { _ in Haptics.light(); action() }))
                .labelsHidden()
                .tint(theme.success)
                .disabled(disabled)
        }
        .padding(.vertical, 12).padding(.horizontal, 16)
        .frame(minHeight: 56)
    }

    private func navRow(icon: String, label: String, sublabel: String?, destructive: Bool = false, isLast: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: { Haptics.light(); action() }) {
            HStack(spacing: 12) {
                iconBox(icon, destructive: destructive)
                VStack(alignment: .leading, spacing: 2) {
                    Text(label).font(.system(size: 15, weight: .medium)).foregroundStyle(destructive ? Color(hex: 0xDC3545) : theme.text)
                    if let sublabel { Text(sublabel).font(.system(size: 12)).foregroundStyle(theme.textTertiary) }
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 14, weight: .semibold)).foregroundStyle(theme.textTertiary)
            }
            .padding(.vertical, 12).padding(.horizontal, 16)
            .frame(minHeight: 56)
            .contentShape(Rectangle())
        }
        .buttonStyle(PressableStyle())
    }

    private func iconBox(_ icon: String, destructive: Bool) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(destructive ? Color(hex: 0xDC3545).opacity(0.1) : theme.backgroundSecondary)
                .frame(width: 32, height: 32)
            Image(systemName: icon).font(.system(size: 16, weight: .medium)).foregroundStyle(destructive ? Color(hex: 0xDC3545) : theme.accent)
        }
    }
}
