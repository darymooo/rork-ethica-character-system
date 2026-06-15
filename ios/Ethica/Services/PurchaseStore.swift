//
//  PurchaseStore.swift
//  Ethica
//

import SwiftUI
import Observation
import RevenueCat

enum PlanKey: String {
    case weekly
    case monthly
}

/// RevenueCat wrapper mirroring `RevenueCatContext.tsx`.
@MainActor
@Observable
final class PurchaseStore {
    private(set) var isInitialized = false
    private(set) var isPro = false
    private(set) var offerings: Offerings?
    private(set) var isLoadingOfferings = true
    private(set) var isPurchasing = false
    private(set) var isRestoring = false

    private let entitlementAliases = ["Ethica Pro", "ethica_pro", "pro", "premium"]

    init() {
        configure()
        Task { await refresh() }
    }

    private func configure() {
        let apiKey = resolveAPIKey()
        guard !apiKey.isEmpty else {
            print("PurchaseStore: RevenueCat API key not found")
            isLoadingOfferings = false
            return
        }
        Purchases.logLevel = .warn
        Purchases.configure(withAPIKey: apiKey)
        isInitialized = true
    }

    private func resolveAPIKey() -> String {
        #if DEBUG
        let testKey = Config.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY
        if !testKey.isEmpty { return testKey }
        #endif
        let iosKey = Config.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
        if !iosKey.isEmpty { return iosKey }
        return Config.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY
    }

    private func hasActivePro(_ info: CustomerInfo?) -> Bool {
        guard let info else { return false }
        let active = info.entitlements.active
        if entitlementAliases.contains(where: { active[$0] != nil }) { return true }
        return !active.isEmpty
    }

    private func activeEntitlement(_ info: CustomerInfo?) -> EntitlementInfo? {
        guard let info else { return nil }
        let active = info.entitlements.active
        if let alias = entitlementAliases.first(where: { active[$0] != nil }) {
            return active[alias]
        }
        return active.values.first
    }

    // MARK: - Public API

    func refresh() async {
        guard isInitialized else {
            isLoadingOfferings = false
            return
        }
        let info = try? await Purchases.shared.customerInfo()
        let fetchedOfferings = try? await Purchases.shared.offerings()
        cachedInfo = info
        isPro = hasActivePro(info)
        if let fetchedOfferings { offerings = fetchedOfferings }
        isLoadingOfferings = false
    }

    func package(for plan: PlanKey) -> Package? {
        guard let packages = offerings?.current?.availablePackages else { return nil }
        let expectedType: PackageType = plan == .weekly ? .weekly : .monthly
        if let matched = packages.first(where: { $0.packageType == expectedType }) {
            return matched
        }
        let matchers: [String] = plan == .weekly ? ["weekly", "week", "p1w"] : ["monthly", "month", "p1m"]
        return packages.first { pkg in
            let searchable = [
                pkg.identifier,
                pkg.storeProduct.productIdentifier,
                pkg.storeProduct.localizedTitle,
                pkg.storeProduct.localizedDescription
            ].joined(separator: " ").lowercased()
            return matchers.contains { searchable.contains($0) }
        }
    }

    func priceString(for plan: PlanKey, fallback: String) -> String {
        package(for: plan)?.storeProduct.localizedPriceString ?? fallback
    }

    var weeklySavingsPercent: Int {
        guard let weekly = package(for: .weekly), let monthly = package(for: .monthly) else { return 0 }
        let weeklyPrice = weekly.storeProduct.price as Decimal
        let monthlyPrice = monthly.storeProduct.price as Decimal
        guard weeklyPrice > 0 else { return 0 }
        let monthlyEquivalent = weeklyPrice * 4
        guard monthlyEquivalent > 0 else { return 0 }
        let savings = (1 - NSDecimalNumber(decimal: monthlyPrice).doubleValue / NSDecimalNumber(decimal: monthlyEquivalent).doubleValue) * 100
        let rounded = Int(savings.rounded())
        return rounded > 0 ? rounded : 0
    }

    private var cachedInfo: CustomerInfo?

    func proExpirationDate() -> Date? {
        activeEntitlement(cachedInfo)?.expirationDate
    }

    @discardableResult
    func purchase(_ plan: PlanKey) async throws -> Bool {
        guard isInitialized else { throw PurchaseError.unavailable }
        guard let pkg = package(for: plan) else { throw PurchaseError.planUnavailable(plan) }
        isPurchasing = true
        defer { isPurchasing = false }
        let result = try await Purchases.shared.purchase(package: pkg)
        if result.userCancelled { throw PurchaseError.cancelled }
        let fresh = try? await Purchases.shared.customerInfo()
        cachedInfo = fresh ?? result.customerInfo
        isPro = hasActivePro(cachedInfo)
        return isPro
    }

    @discardableResult
    func restore() async throws -> Bool {
        guard isInitialized else { throw PurchaseError.unavailable }
        isRestoring = true
        defer { isRestoring = false }
        let info = try await Purchases.shared.restorePurchases()
        cachedInfo = info
        isPro = hasActivePro(info)
        return isPro
    }
}

enum PurchaseError: LocalizedError {
    case unavailable
    case planUnavailable(PlanKey)
    case cancelled

    var errorDescription: String? {
        switch self {
        case .unavailable: return "Purchases are not available on this device."
        case .planUnavailable(let plan): return "The \(plan.rawValue) subscription is not available right now."
        case .cancelled: return "Purchase cancelled"
        }
    }
}
