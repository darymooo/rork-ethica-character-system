//
//  EthicaApp.swift
//  Ethica
//

import SwiftUI

@main
struct EthicaApp: App {
    @State private var store = EthicaStore()
    @State private var purchases = PurchaseStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .environment(purchases)
        }
    }
}
