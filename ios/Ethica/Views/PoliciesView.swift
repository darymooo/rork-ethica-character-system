//
//  PoliciesView.swift
//  Ethica
//

import SwiftUI

struct PoliciesView: View {
    let initialSection: PolicySection

    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var selected: PolicySection

    init(initialSection: PolicySection) {
        self.initialSection = initialSection
        _selected = State(initialValue: initialSection)
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Privacy & Terms", theme: theme) { router.pop() }
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 0) {
                        tabRow.padding(.top, 8)
                        if selected == .terms {
                            termsSection
                            Rectangle().fill(theme.borderLight).frame(height: 1).padding(.vertical, 8)
                            privacySection
                        } else {
                            privacySection
                            Rectangle().fill(theme.borderLight).frame(height: 1).padding(.vertical, 8)
                            termsSection
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 32)
                    .frame(maxWidth: 760)
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    private var tabRow: some View {
        HStack(spacing: 12) {
            tab("Privacy Policy", section: .privacy)
            tab("Terms of Use", section: .terms)
        }
    }

    private func tab(_ title: String, section: PolicySection) -> some View {
        let active = selected == section
        return Button { withAnimation { selected = section } } label: {
            Text(title).font(.system(size: FontSize.body, weight: .semibold))
                .foregroundStyle(active ? theme.background : theme.textSecondary)
                .frame(maxWidth: .infinity).padding(.vertical, 12).padding(.horizontal, 16)
                .background(RoundedRectangle(cornerRadius: 14).fill(active ? theme.text : theme.surface).overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.border, lineWidth: 1)))
        }
        .buttonStyle(PressableStyle())
    }

    private var privacySection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionTitle("Privacy Policy", updated: "Last updated: January 2026")
            heading("Data Collection")
            paragraph("Ethica stores all your data locally on your device. Your virtue practice records, observations, and settings remain entirely on your device. We do not collect or store any personal information on external servers.")
            heading("What We Store Locally")
            paragraph("• Your selected virtues and practice history\n• Daily observations and notes\n• App preferences and settings\n• Streak and progress data")
            heading("In-App Purchases")
            paragraph("We use RevenueCat to process in-app purchases and subscriptions. RevenueCat may collect limited transaction data (subscription status, purchase receipts) to manage your premium features. This data is handled according to RevenueCat's privacy policy. We do not have access to your payment information.")
            heading("Data Sharing")
            paragraph("We do not share, sell, or transfer your personal data to any third parties beyond what is necessary for processing subscriptions via RevenueCat. Your character development journey remains private.")
            heading("Data Export & Deletion")
            paragraph("You can export your data at any time through the Settings menu. You can also reset all data, which permanently deletes all stored information from your device.")
            heading("Analytics")
            paragraph("We do not use any third-party analytics services. All statistics and insights are calculated locally on your device.")
        }
        .padding(.vertical, 24)
    }

    private var termsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            sectionTitle("Terms of Use", updated: "Last updated: January 2026")
            heading("Acceptance of Terms")
            paragraph("By using Ethica, you agree to these terms. The app is provided for personal character development and self-improvement purposes.")
            heading("Use of the App")
            paragraph("Ethica is designed to help you practice Benjamin Franklin's method of character formation. The app is intended for personal use and self-reflection.")
            heading("Subscriptions")
            paragraph("Ethica Pro subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period. Payment is charged to your Apple ID account at confirmation of purchase. You can manage and cancel your subscription through your App Store account settings.")
            heading("No Medical Advice")
            paragraph("This app is not a substitute for professional medical, psychological, or therapeutic advice. If you are experiencing mental health challenges, please consult a qualified professional.")
            heading("User Responsibility")
            paragraph("You are responsible for maintaining the security of your device and any data stored within the app. We recommend regular backups using the export feature.")
            heading("Disclaimer")
            paragraph("The app is provided \"as is\" without warranties of any kind. We are not liable for any loss of data or any indirect, incidental, or consequential damages arising from your use of the app.")
            heading("Changes to Terms")
            paragraph("We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.")
            heading("Contact")
            paragraph("If you have questions about these policies, please reach out through the app store listing or our support channels.")
        }
        .padding(.vertical, 24)
    }

    private func sectionTitle(_ title: String, updated: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.system(size: FontSize.large, weight: .bold)).foregroundStyle(theme.text)
            Text(updated).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
        }
        .padding(.bottom, 8)
    }

    private func heading(_ text: String) -> some View {
        Text(text).font(.system(size: FontSize.label, weight: .semibold)).foregroundStyle(theme.text).padding(.top, 8)
    }

    private func paragraph(_ text: String) -> some View {
        Text(text).font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).lineSpacing(6).frame(maxWidth: .infinity, alignment: .leading)
    }
}
