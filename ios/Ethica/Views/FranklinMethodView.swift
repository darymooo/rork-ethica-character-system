//
//  FranklinMethodView.swift
//  Ethica
//

import SwiftUI

/// Shared body content for the Franklin's method explainer.
private struct FranklinMethodContent: View {
    @Environment(\.theme) private var theme
    var includeHowTo: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 32) {
            section("The Original System", "In 1726, at age 20, Benjamin Franklin devised a methodical system for moral improvement. He identified thirteen virtues essential to his character and created a disciplined practice for cultivating each one.")
            sectionMulti("The Little Book", [
                "Franklin made a small book with a page for each virtue. Each page contained seven columns for the days of the week and thirteen rows for the virtues. He would focus on a single virtue each week while keeping watch over all thirteen.",
                "When he committed a fault against the week's virtue, he marked it with a black spot. His aim was not perfection, but to diminish the number of marks over time."
            ])
            quote("I was surpris'd to find myself so much fuller of faults than I had imagined; but I had the satisfaction of seeing them diminish.", "— Benjamin Franklin")
            sectionMulti("The Weekly Cycle", [
                "Franklin dedicated one week to each virtue, cycling through all thirteen in a quarter year. He repeated this cycle four times annually, allowing him to practice each virtue four times per year."
            ] + (includeHowTo ? [] : [
                "Over time, his little book became worn from use. He transferred his marks to a new book with ivory pages that could be wiped clean and reused."
            ]))
            if includeHowTo {
                sectionMulti("How to Use This App", [
                    "• Select a virtue to focus on for 7 days",
                    "• Each day, observe your actions and mark if you committed a fault",
                    "• At week's end, review your progress and choose your next virtue",
                    "• Complete all 13 virtues to finish a cycle"
                ])
            } else {
                section("The Philosophy", "Franklin believed that virtue could be cultivated through deliberate practice, much like acquiring any skill. His system was rational rather than mystical, practical rather than aspirational.")
                quote("On the whole, tho' I never arrived at the perfection I had been so ambitious of obtaining, but fell far short of it, yet I was, by the endeavour, a better and happier man than I otherwise should have been.", "— Benjamin Franklin, Autobiography")
                section("Lifelong Practice", "Franklin maintained this practice for decades, attributing much of his success and happiness to this disciplined self-examination. The system was never about achieving moral perfection, but about conscious attention to character and steady, incremental improvement over a lifetime.")
            }
        }
    }

    private func section(_ title: String, _ body: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title).font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            Text(body).font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).lineSpacing(6)
        }
    }

    private func sectionMulti(_ title: String, _ bodies: [String]) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title).font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            ForEach(bodies, id: \.self) { Text($0).font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).lineSpacing(6) }
        }
    }

    private func quote(_ text: String, _ attribution: String) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("“\(text)”").font(.system(size: FontSize.body, weight: .medium)).italic().foregroundStyle(theme.text).lineSpacing(6)
            Text(attribution).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
        }
        .padding(.vertical, 24)
        .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
        .overlay(alignment: .bottom) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }
}

struct FranklinMethodView: View {
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Franklin's Method", theme: theme) { router.pop() }
                ScrollView(showsIndicators: false) {
                    FranklinMethodContent(includeHowTo: false)
                        .padding(.horizontal, 32)
                        .padding(.bottom, 48)
                        .frame(maxWidth: 760)
                        .frame(maxWidth: .infinity)
                }
            }
        }
    }
}

/// Presented as a sheet from Home's first-week tip.
struct FranklinMethodSheet: View {
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                FranklinMethodContent(includeHowTo: true)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 24)
            }
            .background(theme.background)
            .navigationTitle("Franklin's Method")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: { Image(systemName: "xmark").foregroundStyle(theme.text) }
                }
            }
        }
    }
}
