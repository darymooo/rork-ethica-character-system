//
//  VirtueSelectionView.swift
//  Ethica
//

import SwiftUI

struct VirtueSelectionView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var selectedVirtueId: String?
    @State private var expandedVirtueId: String?
    @State private var appeared = false

    private var nextQueued: String? { store.nextQueuedVirtue }
    private var needsImprovement: [String] { store.virtuesNeedingImprovement() }
    private var customVirtues: [Virtue] { store.customVirtuesAsVirtues }

    private var selectedVirtue: Virtue? {
        guard let id = selectedVirtueId else { return nil }
        return Virtues.byId(id) ?? customVirtues.first { $0.id == id }
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 16) {
                        if !customVirtues.isEmpty {
                            sectionHeader(icon: "sparkles", text: "Your Custom Virtues")
                            ForEach(customVirtues) { virtue in
                                card(for: virtue, badge: .custom)
                            }
                            sectionHeader(icon: nil, text: "Franklin's 13 Virtues")
                                .padding(.top, 16)
                        }
                        ForEach(Array(Virtues.all.enumerated()), id: \.element.id) { index, virtue in
                            card(for: virtue, badge: needsImprovement.contains(virtue.id) ? .focus : .none)
                                .opacity(appeared ? 1 : 0)
                                .offset(y: appeared ? 0 : 20)
                                .animation(.easeOut(duration: 0.3).delay(Double(index) * 0.02), value: appeared)
                        }
                    }
                    .padding(.horizontal, 32)
                    .padding(.bottom, 32)
                }
                if let selectedVirtue {
                    footer(selectedVirtue)
                }
            }
            .frame(maxWidth: 700)
            .frame(maxWidth: .infinity)
        }
        .onAppear {
            if selectedVirtueId == nil { selectedVirtueId = nextQueued }
            withAnimation { appeared = true }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Select a virtue")
                .font(.system(size: FontSize.large, weight: .bold))
                .foregroundStyle(theme.text)
            Text("You will focus on this virtue for the next 7 days.")
                .font(.system(size: FontSize.body))
                .foregroundStyle(theme.textSecondary)
            if let nextQueued, let name = Virtues.byId(nextQueued)?.name {
                HStack {
                    Text("Next in queue: ")
                        .foregroundStyle(theme.textSecondary)
                    + Text(name).foregroundStyle(theme.text).bold()
                }
                .font(.system(size: FontSize.body))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(theme.surface)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(theme.accent, lineWidth: 1))
                )
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 32)
        .padding(.top, 24)
        .padding(.bottom, 24)
    }

    private func sectionHeader(icon: String?, text: String) -> some View {
        HStack(spacing: 8) {
            if let icon {
                Image(systemName: icon).font(.system(size: 14)).foregroundStyle(theme.accent)
            }
            SectionLabel(text: text, theme: theme)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .bottom) { Rectangle().fill(theme.border).frame(height: 1) }
    }

    private enum Badge { case none, custom, focus }

    private func card(for virtue: Virtue, badge: Badge) -> some View {
        let isExpanded = expandedVirtueId == virtue.id
        let isSelected = selectedVirtueId == virtue.id
        return VStack(spacing: 0) {
            Button {
                Haptics.selection()
                selectedVirtueId = virtue.id
            } label: {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Text(virtue.name)
                                .font(.system(size: FontSize.title, weight: .bold))
                                .foregroundStyle(theme.text)
                            switch badge {
                            case .custom: badgeView("Custom", color: theme.accent, filled: true)
                            case .focus: badgeView("Focus", color: theme.textTertiary, filled: false)
                            case .none: EmptyView()
                            }
                        }
                        Text(virtue.description)
                            .font(.system(size: FontSize.body))
                            .foregroundStyle(theme.textSecondary)
                            .multilineTextAlignment(.leading)
                            .lineSpacing(4)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            expandedVirtueId = isExpanded ? nil : virtue.id
                        }
                    } label: {
                        Image(systemName: "chevron.down")
                            .font(.system(size: 18))
                            .foregroundStyle(theme.textTertiary)
                            .rotationEffect(.degrees(isExpanded ? 180 : 0))
                    }
                }
                .padding(20)
                .frame(maxWidth: .infinity)
                .background(theme.surface)
                .overlay(Rectangle().stroke(isSelected ? theme.accent : theme.border, lineWidth: 1))
            }
            .buttonStyle(PressableStyle())

            if isExpanded {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionLabel(text: virtue.isCustom ? "Why This Matters" : "Context", theme: theme)
                        Text(virtue.context)
                            .font(.system(size: FontSize.body))
                            .foregroundStyle(theme.textSecondary)
                            .lineSpacing(4)
                    }
                    if !virtue.quote.isEmpty {
                        Rectangle().fill(theme.borderLight).frame(height: 1)
                        VStack(alignment: .leading, spacing: 8) {
                            Text("“\(virtue.quote)”")
                                .font(.system(size: FontSize.body))
                                .italic()
                                .foregroundStyle(theme.text)
                                .lineSpacing(4)
                            Text("— Benjamin Franklin")
                                .font(.system(size: FontSize.caption))
                                .foregroundStyle(theme.textTertiary)
                        }
                    }
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(theme.surface)
                .overlay(Rectangle().stroke(theme.border, lineWidth: 1).padding(.top, -1))
            }
        }
    }

    private func badgeView(_ text: String, color: Color, filled: Bool) -> some View {
        Text(text.uppercased())
            .font(.system(size: 10, weight: .medium))
            .tracking(0.5)
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(
                RoundedRectangle(cornerRadius: 2)
                    .fill(filled ? color.opacity(0.12) : theme.surface)
                    .overlay(RoundedRectangle(cornerRadius: 2).stroke(color, lineWidth: 1))
            )
    }

    private func footer(_ virtue: Virtue) -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 0) {
                Text("Selected: ").foregroundStyle(theme.textSecondary)
                Text(virtue.name).foregroundStyle(theme.text).bold()
            }
            .font(.system(size: FontSize.body))
            OutlineButton(title: "Confirm", theme: theme) {
                confirm(virtue)
            }
        }
        .padding(.horizontal, 32)
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .overlay(alignment: .top) { Rectangle().fill(theme.border).frame(height: 1) }
    }

    private func confirm(_ virtue: Virtue) {
        if virtue.id == nextQueued { store.consumeQueuedVirtue() }
        if store.state.hasCompletedOnboarding {
            store.startNewWeek(virtueId: virtue.id)
        } else {
            store.completeOnboarding(virtueId: virtue.id)
        }
        router.popToRoot()
    }
}
