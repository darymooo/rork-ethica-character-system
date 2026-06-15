//
//  Theme.swift
//  Ethica
//

import SwiftUI

/// Color palette mirroring the React Native app's `colors.ts`.
struct Theme {
    let background: Color
    let backgroundSecondary: Color
    let surface: Color
    let text: Color
    let textSecondary: Color
    let textTertiary: Color
    let border: Color
    let borderLight: Color
    let accent: Color
    let faultDot: Color
    let disabled: Color
    let success: Color

    static let light = Theme(
        background: Color(hex: 0xFBFAF6),
        backgroundSecondary: Color(hex: 0xF3F1EB),
        surface: Color(hex: 0xFFFFFF),
        text: Color(hex: 0x1A1714),
        textSecondary: Color(hex: 0x6B6358),
        textTertiary: Color(hex: 0x9B938A),
        border: Color(hex: 0xE2DED6),
        borderLight: Color(hex: 0xEDEAE4),
        accent: Color(hex: 0x5B3F26),
        faultDot: Color(hex: 0x8C735B),
        disabled: Color(hex: 0xD1CCC3),
        success: Color(hex: 0x54745C)
    )

    static let dark = Theme(
        background: Color(hex: 0x15120E),
        backgroundSecondary: Color(hex: 0x211B15),
        surface: Color(hex: 0x2A231B),
        text: Color(hex: 0xF2EADF),
        textSecondary: Color(hex: 0xC5B7A4),
        textTertiary: Color(hex: 0x8F806E),
        border: Color(hex: 0x44382B),
        borderLight: Color(hex: 0x332A21),
        accent: Color(hex: 0xE4C48F),
        faultDot: Color(hex: 0xB99B72),
        disabled: Color(hex: 0x5B4D3D),
        success: Color(hex: 0x88A887)
    )
}

extension Color {
    init(hex: UInt, alpha: Double = 1.0) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >> 8) & 0xFF) / 255.0,
            blue: Double(hex & 0xFF) / 255.0,
            opacity: alpha
        )
    }
}

private struct ThemeKey: EnvironmentKey {
    static let defaultValue: Theme = .light
}

extension EnvironmentValues {
    var theme: Theme {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

/// Font sizes mirroring `typography.ts`.
enum FontSize {
    static let caption: CGFloat = 12
    static let body: CGFloat = 15
    static let label: CGFloat = 16
    static let title: CGFloat = 20
    static let large: CGFloat = 26
    static let xlarge: CGFloat = 34
}
