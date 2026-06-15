//
//  ProfileView.swift
//  Ethica
//

import SwiftUI

private struct Achievement: Identifiable {
    let id: String
    let title: String
    let description: String
    let icon: String
    let unlocked: Bool
    var progress: Int?
    var total: Int?
}

struct ProfileView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    private var analytics: DetailedAnalytics { store.detailedAnalytics() }
    private var streak: StreakData { store.state.streakData }
    private var cycle: CycleProgress { store.cycleProgress }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Profile", theme: theme) { router.pop() }
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        heroSection
                        statsSection
                        insightsSection
                        milestonesSection
                        quoteSection
                    }
                    .padding(.horizontal, 24)
                    .frame(maxWidth: 760)
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    private var heroSection: some View {
        VStack(spacing: 8) {
            Text("PRACTICING SINCE").font(.system(size: FontSize.caption, weight: .medium)).tracking(1.5).foregroundStyle(theme.textTertiary)
            Text(formatDate(store.state.startDate)).font(.system(size: 22, weight: .bold)).foregroundStyle(theme.text)
            Text("\(store.daysSincePracticing) days on your journey").font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary)
        }
        .padding(.vertical, 32)
    }

    private var statsSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Stats & Progress").font(.system(size: FontSize.label, weight: .bold)).foregroundStyle(theme.text)
            let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
            LazyVGrid(columns: columns, spacing: 12) {
                statCard(icon: "flame", value: streak.currentStreak, label: "Current Streak")
                statCard(icon: "bolt", value: streak.longestStreak, label: "Longest Streak")
                statCard(icon: "calendar", value: streak.totalDaysLogged, label: "Days Logged")
                statCard(icon: "target", value: analytics.totalWeeks, label: "Weeks Done")
            }
            cycleCard
        }
        .padding(.top, 32).padding(.bottom, 8)
        .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }

    private func statCard(icon: String, value: Int, label: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 20)).foregroundStyle(theme.accent)
            Text("\(value)").font(.system(size: 24, weight: .bold)).foregroundStyle(theme.text)
            Text(label).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderLight, lineWidth: 1)))
    }

    private var cycleCard: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Cycle \(cycle.cycleNumber)").font(.system(size: FontSize.body, weight: .bold)).foregroundStyle(theme.text)
                Spacer()
                Text("\(cycle.current) / \(cycle.total) virtues").font(.system(size: FontSize.caption)).foregroundStyle(theme.textSecondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(theme.borderLight).frame(height: 6)
                    Capsule().fill(theme.accent).frame(width: geo.size.width * CGFloat(cycle.percentage) / 100, height: 6)
                }
            }
            .frame(height: 6)
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderLight, lineWidth: 1)))
    }

    private var insightsSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Personal Insights").font(.system(size: FontSize.label, weight: .bold)).foregroundStyle(theme.text)
            VStack(spacing: 12) {
                insightCard(icon: "arrow.up.right", iconColor: theme.success, label: "Strongest Virtue", value: virtueName(analytics.strongestVirtue), hint: "Lowest average faults")
                insightCard(icon: "arrow.down.right", iconColor: theme.faultDot, label: "Needs Attention", value: virtueName(analytics.weakestVirtue), hint: "Highest average faults")
                insightRow(left: ("Success Rate", "\(analytics.successRate)%"), right: ("Avg. Faults/Week", analytics.avgFaultsPerWeek))
                insightRow(left: ("Perfect Weeks", "\(analytics.perfectWeeks)"), right: ("Cycles Completed", "\(analytics.completedCycles)"))
                if let most = analytics.mostPracticedVirtue {
                    insightCard(icon: "book", iconColor: theme.accent, label: "Most Practiced", value: virtueName(most), hint: nil)
                }
            }
        }
        .padding(.top, 32).padding(.bottom, 8)
        .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }

    private func insightCard(icon: String, iconColor: Color, label: String, value: String, hint: String?) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 16)).foregroundStyle(iconColor)
                Text(label).font(.system(size: FontSize.caption, weight: .medium)).tracking(0.5).foregroundStyle(theme.textTertiary)
            }
            Text(value).font(.system(size: FontSize.label, weight: .bold)).foregroundStyle(theme.text)
            if let hint { Text(hint).font(.system(size: 12)).foregroundStyle(theme.textTertiary) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderLight, lineWidth: 1)))
    }

    private func insightRow(left: (String, String), right: (String, String)) -> some View {
        HStack {
            VStack(spacing: 4) {
                Text(left.0).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
                Text(left.1).font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            }.frame(maxWidth: .infinity)
            Rectangle().fill(theme.borderLight).frame(width: 1, height: 40)
            VStack(spacing: 4) {
                Text(right.0).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
                Text(right.1).font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            }.frame(maxWidth: .infinity)
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderLight, lineWidth: 1)))
    }

    private var achievements: [Achievement] {
        [
            Achievement(id: "first_log", title: "First Step", description: "Log your first observation", icon: "book", unlocked: streak.totalDaysLogged >= 1),
            Achievement(id: "week_complete", title: "Week Warrior", description: "Complete your first week", icon: "calendar", unlocked: analytics.totalWeeks >= 1),
            Achievement(id: "perfect_week", title: "Flawless", description: "Achieve a perfect week with no faults", icon: "star", unlocked: analytics.perfectWeeks >= 1),
            Achievement(id: "streak_7", title: "Dedicated", description: "Maintain a 7-day logging streak", icon: "flame", unlocked: streak.longestStreak >= 7, progress: min(streak.longestStreak, 7), total: 7),
            Achievement(id: "streak_30", title: "Steadfast", description: "Maintain a 30-day logging streak", icon: "bolt", unlocked: streak.longestStreak >= 30, progress: min(streak.longestStreak, 30), total: 30),
            Achievement(id: "cycle_complete", title: "Full Circle", description: "Complete one 13-week cycle", icon: "trophy", unlocked: analytics.completedCycles >= 1, progress: cycle.current, total: 13),
            Achievement(id: "five_perfect", title: "Perfectionist", description: "Achieve 5 perfect weeks", icon: "rosette", unlocked: analytics.perfectWeeks >= 5, progress: min(analytics.perfectWeeks, 5), total: 5),
            Achievement(id: "hundred_days", title: "Centurion", description: "Log observations for 100 days", icon: "target", unlocked: streak.totalDaysLogged >= 100, progress: min(streak.totalDaysLogged, 100), total: 100)
        ]
    }

    private var milestonesSection: some View {
        let list = achievements
        let unlocked = list.filter { $0.unlocked }.count
        return VStack(alignment: .leading, spacing: 20) {
            HStack {
                Text("Milestones").font(.system(size: FontSize.label, weight: .bold)).foregroundStyle(theme.text)
                Spacer()
                Text("\(unlocked) / \(list.count)").font(.system(size: FontSize.caption, weight: .medium)).foregroundStyle(theme.textTertiary)
            }
            VStack(spacing: 10) {
                ForEach(list) { achievement in
                    achievementCard(achievement)
                }
            }
        }
        .padding(.top, 32).padding(.bottom, 8)
        .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }

    private func achievementCard(_ a: Achievement) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle().fill(a.unlocked ? theme.backgroundSecondary : Color.clear).frame(width: 40, height: 40)
                Image(systemName: a.icon).font(.system(size: 20)).foregroundStyle(theme.accent)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(a.title).font(.system(size: FontSize.body, weight: .semibold)).foregroundStyle(theme.text)
                Text(a.description).font(.system(size: 12)).foregroundStyle(theme.textTertiary)
                if !a.unlocked, let progress = a.progress, let total = a.total {
                    HStack(spacing: 8) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(theme.borderLight).frame(height: 4)
                                Capsule().fill(theme.accent).frame(width: geo.size.width * CGFloat(progress) / CGFloat(total), height: 4)
                            }
                        }.frame(height: 4)
                        Text("\(progress)/\(total)").font(.system(size: 12)).foregroundStyle(theme.textTertiary)
                    }
                    .padding(.top, 6)
                }
            }
            Spacer()
            if a.unlocked {
                ZStack {
                    Circle().fill(theme.success).frame(width: 24, height: 24)
                    Image(systemName: "checkmark").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                }
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.borderLight, lineWidth: 1)))
        .opacity(a.unlocked ? 1 : 0.5)
    }

    private var quoteSection: some View {
        VStack(spacing: 12) {
            Text("“I did not aim for perfection, but for fewer faults.”")
                .font(.system(size: FontSize.body, weight: .medium)).italic().foregroundStyle(theme.textSecondary).multilineTextAlignment(.center).lineSpacing(6)
            Text("— Benjamin Franklin").font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
        }
        .padding(.vertical, 32).padding(.bottom, 24)
        .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }

    private func virtueName(_ id: String?) -> String {
        guard let id else { return "—" }
        return Virtues.byId(id)?.name ?? "—"
    }

    private func formatDate(_ str: String?) -> String {
        guard let str, let date = DateKey.date(from: str) else { return "Not set" }
        let f = DateFormatter()
        f.dateFormat = "MMMM d, yyyy"
        return f.string(from: date)
    }
}
