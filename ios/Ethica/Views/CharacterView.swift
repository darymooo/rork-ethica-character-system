//
//  CharacterView.swift
//  Ethica
//

import SwiftUI

struct CharacterView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var expandedId: String?

    private struct Stat: Identifiable {
        let virtue: Virtue
        let totalWeeks: Int
        let totalFaults: Int
        let history: [WeekRecord]
        var id: String { virtue.id }
    }

    private var stats: [Stat] {
        Virtues.all.compactMap { virtue in
            let history = store.virtueHistory(virtue.id)
            guard !history.isEmpty else { return nil }
            let faults = history.reduce(0) { $0 + $1.observations.filter { $0.hasFault }.count }
            return Stat(virtue: virtue, totalWeeks: history.count, totalFaults: faults, history: history)
        }
    }

    private var totalWeeksPracticed: Int { stats.reduce(0) { $0 + $1.totalWeeks } }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Character", theme: theme) { router.pop() }
                ScrollView(showsIndicators: false) {
                    if totalWeeksPracticed > 0 {
                        VStack(spacing: 0) {
                            VStack(spacing: 8) {
                                Text("\(totalWeeksPracticed)").font(.system(size: 56, weight: .bold)).foregroundStyle(theme.text)
                                Text(totalWeeksPracticed == 1 ? "week practiced" : "weeks practiced").font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary)
                            }
                            .padding(.vertical, 32)
                            Rectangle().fill(theme.borderLight).frame(height: 1).padding(.bottom, 24)
                            SectionLabel(text: "Virtues Practiced", theme: theme).frame(maxWidth: .infinity, alignment: .leading).padding(.bottom, 24)
                            VStack(spacing: 24) {
                                ForEach(stats) { stat in virtueItem(stat) }
                            }
                        }
                        .padding(.horizontal, 32)
                        .padding(.bottom, 32)
                        .frame(maxWidth: 760)
                        .frame(maxWidth: .infinity)
                    } else {
                        VStack(spacing: 12) {
                            Text("No practice recorded yet.").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.center)
                            Text("Complete your first week to begin building your character history.")
                                .font(.system(size: FontSize.body)).foregroundStyle(theme.textTertiary).multilineTextAlignment(.center).lineSpacing(4).padding(.horizontal, 32)
                        }
                        .padding(.vertical, 80)
                    }
                }
            }
        }
    }

    private func virtueItem(_ stat: Stat) -> some View {
        let isExpanded = expandedId == stat.virtue.id
        return VStack(alignment: .leading, spacing: 16) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { expandedId = isExpanded ? nil : stat.virtue.id }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(stat.virtue.name).font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
                        Text("\(stat.totalWeeks) \(stat.totalWeeks == 1 ? "cycle" : "cycles")").font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down").font(.system(size: 18)).foregroundStyle(theme.textTertiary)
                }
            }
            .buttonStyle(PressableStyle())

            if isExpanded {
                VStack(alignment: .leading, spacing: 16) {
                    detail("Precept", stat.virtue.fullDescription, medium: true)
                    Rectangle().fill(theme.borderLight).frame(height: 1)
                    detail("Context", stat.virtue.context, medium: false)
                    Rectangle().fill(theme.borderLight).frame(height: 1)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("“\(stat.virtue.quote)”").font(.system(size: FontSize.body, weight: .medium)).italic().foregroundStyle(theme.text).lineSpacing(4)
                        Text("— Benjamin Franklin").font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
                    }
                    Rectangle().fill(theme.borderLight).frame(height: 1)
                    VStack(alignment: .leading, spacing: 8) {
                        SectionLabel(text: "History", theme: theme)
                        ForEach(Array(stat.history.enumerated()), id: \.element.id) { index, week in
                            let faults = week.observations.filter { $0.hasFault }.count
                            HStack {
                                Text("Week \(index + 1)").font(.system(size: FontSize.body)).foregroundStyle(theme.textTertiary)
                                Spacer()
                                Text("\(faults) \(faults == 1 ? "fault" : "faults")").font(.system(size: FontSize.body, weight: .medium)).foregroundStyle(theme.text)
                            }
                        }
                    }
                }
                .padding(16)
                .background(Rectangle().fill(theme.backgroundSecondary).overlay(Rectangle().stroke(theme.borderLight, lineWidth: 1)))
            }
        }
        .padding(.bottom, 24)
        .overlay(alignment: .bottom) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }

    private func detail(_ label: String, _ text: String, medium: Bool) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: label, theme: theme)
            Text(text).font(.system(size: FontSize.body, weight: medium ? .medium : .regular)).foregroundStyle(medium ? theme.text : theme.textSecondary).lineSpacing(4)
        }
    }
}
