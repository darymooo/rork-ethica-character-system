//
//  PaywallView.swift
//  Ethica
//

import SwiftUI

struct PaywallView: View {
    let origin: PaywallOrigin

    @Environment(EthicaStore.self) private var store
    @Environment(PurchaseStore.self) private var purchases
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var selectedPlan: PlanKey = .monthly
    @State private var isRefreshing = false
    @State private var alertMessage: AlertMessage?

    private let features = [
        "Unlimited custom virtues",
        "Track your own principles",
        "Advanced analytics & insights",
        "Export your complete journal",
        "Priority support"
    ]

    private var weeklyPrice: String { purchases.priceString(for: .weekly, fallback: "$2.99") }
    private var monthlyPrice: String { purchases.priceString(for: .monthly, fallback: "$9.99") }
    private var selectedPackageExists: Bool { purchases.package(for: selectedPlan) != nil }

    private var activePriceLabel: String {
        selectedPlan == .monthly ? "\(monthlyPrice)/month" : "\(weeklyPrice)/week"
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                Spacer(minLength: 8)
                header
                features_view.padding(.top, 16)

                if purchases.isLoadingOfferings {
                    ProgressView().tint(theme.accent).padding(.vertical, 20)
                } else if purchases.isPro {
                    proBadge.padding(.top, 16)
                } else {
                    pricingRow.padding(.top, 16)
                }

                if !purchases.isLoadingOfferings && !purchases.isPro {
                    PrimaryButton(
                        title: "Subscribe \(selectedPlan == .monthly ? "Monthly" : "Weekly")",
                        theme: theme,
                        enabled: selectedPackageExists,
                        loading: purchases.isPurchasing
                    ) { Task { await purchase() } }
                    .padding(.top, 16)
                }

                Button { close() } label: {
                    Text("Continue with free version").font(.system(size: FontSize.body, weight: .medium)).foregroundStyle(theme.textSecondary)
                }
                .buttonStyle(PressableStyle())
                .padding(.vertical, 8)

                restoreRow

                legalRow.padding(.top, 4)
                Spacer(minLength: 8)
            }
            .padding(.horizontal, 24)
            .frame(maxWidth: 600)
            .frame(maxWidth: .infinity)
        }
        .alert(item: $alertMessage) { msg in
            Alert(title: Text(msg.title), message: Text(msg.message), dismissButton: .default(Text("OK")) {
                if msg.dismissesPaywall { close() }
            })
        }
        .task { await purchases.refresh() }
    }

    private var header: some View {
        VStack(spacing: 6) {
            Text("Ethica Pro").font(.system(size: FontSize.xlarge, weight: .bold)).foregroundStyle(theme.text)
            Text("Unlock the full potential of your character development journey")
                .font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.center).lineSpacing(2).frame(maxWidth: 320)
        }
    }

    private var features_view: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(features, id: \.self) { feature in
                HStack(spacing: 10) {
                    Image(systemName: "checkmark").font(.system(size: 13, weight: .bold)).foregroundStyle(theme.accent)
                    Text(feature).font(.system(size: 14)).foregroundStyle(theme.text)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var proBadge: some View {
        Text("Ethica Pro is active on this device")
            .font(.system(size: 14, weight: .semibold)).foregroundStyle(theme.accent)
            .frame(maxWidth: .infinity).padding(.vertical, 10).padding(.horizontal, 16)
            .background(RoundedRectangle(cornerRadius: 12).fill(theme.accent.opacity(0.08)).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.accent, lineWidth: 1)))
    }

    private var pricingRow: some View {
        HStack(spacing: 10) {
            planCard(.monthly, name: "Monthly", price: monthlyPrice, period: "per month", bestValue: purchases.weeklySavingsPercent > 0)
            planCard(.weekly, name: "Weekly", price: weeklyPrice, period: "per week", bestValue: false)
        }
    }

    private func planCard(_ plan: PlanKey, name: String, price: String, period: String, bestValue: Bool) -> some View {
        let selected = selectedPlan == plan
        return Button {
            Haptics.selection()
            selectedPlan = plan
        } label: {
            VStack(spacing: 4) {
                Text(name).font(.system(size: FontSize.body, weight: .bold)).foregroundStyle(theme.text)
                Text(price).font(.system(size: 20, weight: .semibold)).foregroundStyle(theme.text)
                Text(period).font(.system(size: 12)).foregroundStyle(theme.textTertiary)
            }
            .frame(maxWidth: .infinity)
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 16).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 16).stroke(selected ? theme.accent : theme.border, lineWidth: selected ? 2 : 1)))
            .overlay(alignment: .top) {
                if bestValue {
                    Text("BEST VALUE").font(.system(size: 10, weight: .semibold)).tracking(0.5).foregroundStyle(.white)
                        .padding(.horizontal, 10).padding(.vertical, 3)
                        .background(Capsule().fill(theme.accent))
                        .offset(y: -9)
                }
            }
        }
        .buttonStyle(PressableStyle())
    }

    private var restoreRow: some View {
        HStack(spacing: 8) {
            Button { Task { await restore() } } label: {
                Text(purchases.isRestoring ? "Restoring..." : "Restore Purchases").font(.system(size: 13)).foregroundStyle(theme.textTertiary)
            }.disabled(purchases.isRestoring)
            Text("·").foregroundStyle(theme.textTertiary)
            Button { Task { await refresh() } } label: {
                Text(isRefreshing ? "Refreshing..." : "Refresh").font(.system(size: 13)).foregroundStyle(theme.textTertiary)
            }.disabled(isRefreshing || purchases.isLoadingOfferings)
        }
    }

    private var legalRow: some View {
        VStack(spacing: 4) {
            Text("\(activePriceLabel). Cancel anytime.").font(.system(size: 11)).foregroundStyle(theme.textTertiary)
            HStack(spacing: 8) {
                Button { openPolicy(.terms) } label: {
                    Text("Terms of Use").font(.system(size: 11, weight: .semibold)).underline().foregroundStyle(theme.accent)
                }
                Text("|").font(.system(size: 11)).foregroundStyle(theme.textTertiary)
                Button { openPolicy(.privacy) } label: {
                    Text("Privacy Policy").font(.system(size: 11, weight: .semibold)).underline().foregroundStyle(theme.accent)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 10)
        .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }

    // MARK: Actions

    private func close() {
        router.paywall = nil
    }

    private func openPolicy(_ section: PolicySection) {
        Haptics.light()
        router.paywall = nil
        // Defer push so the cover dismiss completes first.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            router.push(.policies(section: section))
        }
    }

    private func purchase() async {
        Haptics.medium()
        guard selectedPackageExists else {
            alertMessage = AlertMessage(title: "Subscription Unavailable", message: "The \(selectedPlan.rawValue) subscription is not available right now. Please refresh and try again.")
            return
        }
        do {
            _ = try await purchases.purchase(selectedPlan)
            Haptics.success()
            alertMessage = AlertMessage(title: "Welcome to Ethica Pro", message: "You now have access to all premium features.", dismissesPaywall: true)
        } catch PurchaseError.cancelled {
            // user cancelled — no alert
        } catch {
            alertMessage = AlertMessage(title: "Purchase Failed", message: error.localizedDescription)
        }
    }

    private func restore() async {
        Haptics.light()
        do {
            _ = try await purchases.restore()
            alertMessage = AlertMessage(title: "Restore Complete", message: "Your purchases have been restored.", dismissesPaywall: true)
        } catch {
            alertMessage = AlertMessage(title: "Restore Failed", message: error.localizedDescription)
        }
    }

    private func refresh() async {
        Haptics.light()
        isRefreshing = true
        await purchases.refresh()
        isRefreshing = false
        alertMessage = AlertMessage(title: "Refreshed", message: "Subscription products have been refreshed.")
    }
}

private struct AlertMessage: Identifiable {
    let id = UUID()
    let title: String
    let message: String
    var dismissesPaywall: Bool = false
}
