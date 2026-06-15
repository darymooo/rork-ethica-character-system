//
//  AppRouter.swift
//  Ethica
//

import SwiftUI
import Observation

/// Push destinations within the main navigation stack.
enum Route: Hashable {
    case settings
    case profile
    case analytics
    case journal
    case personalJournal
    case character
    case franklinMethod
    case policies(section: PolicySection)
    case customVirtues
    case virtueQueue
    case weekReview
}

enum PolicySection: Hashable {
    case privacy
    case terms
}

/// Where the paywall returns the user when dismissed.
enum PaywallOrigin: Hashable, Identifiable {
    case settings
    case virtueSelection
    case generic

    var id: Int { hashValue }
}

@MainActor
@Observable
final class AppRouter {
    var path = NavigationPath()
    var paywall: PaywallOrigin?

    func presentPaywall(_ origin: PaywallOrigin) {
        paywall = origin
    }

    func push(_ route: Route) {
        path.append(route)
    }

    func pop() {
        if !path.isEmpty { path.removeLast() }
    }

    func popToRoot() {
        path = NavigationPath()
    }
}
