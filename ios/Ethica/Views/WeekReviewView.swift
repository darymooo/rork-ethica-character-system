//
//  WeekReviewView.swift
//  Ethica
//

import SwiftUI

struct WeekReviewView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var appeared = false
    @State private var quote = Virtues.quotes.randomElement() ?? Virtues.quotes[0]

    private var currentVirtue: Virtue? { Virtues.byId(store.state.currentVirtueId) }
    private var observations: [DailyObservation] { store.currentWeekObservations }
    private var totalFaults: Int { observations.filter { $0.hasFault }.count }

    private var previousWeeks: [WeekRecord] {
        guard let v = currentVirtue else { return [] }
        return store.virtueHistory(v.id)
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            if let currentVirtue {
                VStack(spacing: 0) {
                    DetailHeader(title: "Weekly Reflection", theme: theme) { router.pop() }
                    ScrollView(showsIndicators: false) {
                        resultsSection(currentVirtue)
                            .frame(maxWidth: 600)
                            .frame(maxWidth: .infinity)
                            .opacity(appeared ? 1 : 0)
                            .offset(y: appeared ? 0 : 24)
                    }
                    footer(currentVirtue)
                }
            }
        }
        .onAppear { withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) { appeared = true } }
    }

    private func resultsSection(_ virtue: Virtue) -> some View {
        VStack(spacing: 32) {
            Text(virtue.name).font(.system(size: FontSize.xlarge, weight: .bold)).foregroundStyle(theme.text)

            VStack(spacing: 8) {
                Text("\(totalFaults)").font(.system(size: 72, weight: .bold)).foregroundStyle(theme.text)
                Text(totalFaults == 1 ? "fault this week" : "faults this week")
                    .font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary)
            }

            if !previousWeeks.isEmpty {
                VStack(spacing: 16) {
                    SectionLabel(text: "Previous Attempts", theme: theme)
                    HStack(spacing: 12) {
                        ForEach(Array(previousWeeks.enumerated()), id: \.element.id) { index, week in
                            attemptItem(label: "Week \(index + 1)", value: week.observations.filter { $0.hasFault }.count, highlighted: false)
                        }
                        attemptItem(label: "This week", value: totalFaults, highlighted: true)
                    }
                }
            }

            VStack(spacing: 16) {
                Text("“\(quote)”")
                    .font(.system(size: FontSize.body, weight: .medium))
                    .italic()
                    .foregroundStyle(theme.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(6)
                Text("— Benjamin Franklin").font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
            }
            .padding(.vertical, 32)
            .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
            .overlay(alignment: .bottom) { Rectangle().fill(theme.borderLight).frame(height: 1) }
        }
        .padding(.horizontal, 32)
        .padding(.vertical, 24)
    }

    private func attemptItem(label: String, value: Int, highlighted: Bool) -> some View {
        VStack(spacing: 4) {
            Text(label).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
            Text("\(value)").font(.system(size: FontSize.title, weight: .semibold)).foregroundStyle(theme.text)
        }
        .padding(.horizontal, 16).padding(.vertical, 8)
        .background(
            highlighted ? RoundedRectangle(cornerRadius: 8).stroke(theme.accent, lineWidth: 1) : nil
        )
    }

    private func footer(_ virtue: Virtue) -> some View {
        VStack(spacing: 16) {
            OutlineButton(title: "Proceed to next virtue", theme: theme) { proceedToNext() }
            Button { repeatVirtue(virtue) } label: {
                Text("Repeat this virtue").font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary)
            }
            .buttonStyle(PressableStyle())
        }
        .padding(.horizontal, 32).padding(.vertical, 24)
        .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }

    private func proceedToNext() {
        store.completeWeek(observations: observations)
        router.popToRoot()
    }

    private func repeatVirtue(_ virtue: Virtue) {
        let id = virtue.id
        store.completeWeek(observations: observations)
        store.startNewWeek(virtueId: id)
        router.popToRoot()
    }
}
