//
//  UIComponents.swift
//  Ethica
//

import SwiftUI

/// Outlined pill button matching the RN `logButton` / `confirmButton` style.
struct OutlineButton: View {
    let title: String
    var theme: Theme
    var action: () -> Void

    @State private var pressed = false

    var body: some View {
        Button {
            Haptics.light()
            action()
        } label: {
            Text(title)
                .font(.system(size: FontSize.label, weight: .semibold))
                .foregroundStyle(theme.text)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(theme.border, lineWidth: 1)
                )
        }
        .buttonStyle(PressableStyle())
    }
}

/// Solid primary button (`subscribeButton` / `saveButton`).
struct PrimaryButton: View {
    let title: String
    var theme: Theme
    var enabled: Bool = true
    var loading: Bool = false
    var action: () -> Void

    var body: some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            ZStack {
                if loading {
                    ProgressView()
                        .tint(theme.background)
                } else {
                    Text(title)
                        .font(.system(size: FontSize.label, weight: .semibold))
                        .foregroundStyle(theme.background)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 17)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(enabled ? theme.text : theme.disabled)
            )
            .opacity(enabled ? 1 : 0.6)
        }
        .disabled(!enabled || loading)
        .buttonStyle(PressableStyle())
    }
}

/// Press animation: compresses slightly on tap.
struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.9 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

/// Shared back-arrow header used across detail screens.
struct DetailHeader: View {
    let title: String
    var theme: Theme
    var trailing: AnyView? = nil
    var onBack: () -> Void

    var body: some View {
        HStack {
            Button {
                Haptics.light()
                onBack()
            } label: {
                Image(systemName: "arrow.left")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(theme.text)
                    .frame(width: 36, height: 36)
            }
            Spacer()
            Text(title)
                .font(.system(size: FontSize.title, weight: .bold))
                .foregroundStyle(theme.text)
            Spacer()
            if let trailing {
                trailing.frame(width: 36, height: 36)
            } else {
                Color.clear.frame(width: 36, height: 36)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }
}

/// Uppercase section label.
struct SectionLabel: View {
    let text: String
    var theme: Theme
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: FontSize.caption, weight: .medium))
            .tracking(1)
            .foregroundStyle(theme.textTertiary)
    }
}

extension View {
    /// Constrains content width on large screens for intentional iPad layouts.
    func pageWidth(_ maxWidth: CGFloat = 860) -> some View {
        frame(maxWidth: maxWidth)
            .frame(maxWidth: .infinity)
    }
}
