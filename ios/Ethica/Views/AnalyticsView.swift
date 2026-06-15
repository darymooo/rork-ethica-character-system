//
//  AnalyticsView.swift
//  Ethica
//

import SwiftUI

struct AnalyticsView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    private var analytics: DetailedAnalytics { store.detailedAnalytics() }
    private var streak: StreakData { store.state.streakData }
    private var virtueStats: [VirtueStats] { store.virtueStatistics() }
    private var hasData: Bool { analytics.totalWeeks > 0 || streak.totalDaysLogged > 0 }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Analytics", theme: theme) { router.pop() }
                ScrollView(showsIndicators: false) {
                    if hasData {
                        VStack(spacing: 0) {
                            streakCard.padding(.bottom, 24)
                            statsGrid.padding(.bottom, 32)
                            insightsSection.padding(.bottom, 32)
                            if !analytics.weeklyFaultTrend.isEmpty { trendSection.padding(.bottom, 32) }
                            if !virtueStats.isEmpty { breakdownSection }
                        }
                        .padding(.horizontal, 24)
                        .padding(.bottom, 32)
                        .frame(maxWidth: 760)
                        .frame(maxWidth: .infinity)
                    } else {
                        emptyState
                    }
                }
            }
        }
    }

    private var streakCard: some View {
        VStack(spacing: 0) {
            Image(systemName: "flame.fill").font(.system(size: 32)).foregroundStyle(Color(hex: 0xE8834A)).padding(.bottom, 12)
            Text("\(streak.currentStreak)").font(.system(size: 64, weight: .bold)).foregroundStyle(theme.text)
            Text("day streak").font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).padding(.top, 4)
            Rectangle().fill(theme.borderLight).frame(height: 1).padding(.vertical, 24)
            HStack(spacing: 32) {
                metaItem("\(streak.longestStreak)", "longest")
                Rectangle().fill(theme.borderLight).frame(width: 1, height: 32)
                metaItem("\(streak.totalDaysLogged)", "total days")
            }
        }
        .padding(.vertical, 32).padding(.horizontal, 24)
        .frame(maxWidth: .infinity)
        .background(Rectangle().fill(theme.surface).overlay(Rectangle().stroke(theme.border, lineWidth: 1)))
    }

    private func metaItem(_ value: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: FontSize.title, weight: .semibold)).foregroundStyle(theme.text)
            Text(label).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
        }
    }

    private var statsGrid: some View {
        let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
        return LazyVGrid(columns: columns, spacing: 12) {
            statCard(icon: "target", value: "\(analytics.successRate)%", label: "Success Rate")
            statCard(icon: "calendar", value: "\(analytics.totalWeeks)", label: "Weeks")
            statCard(icon: "rosette", value: "\(analytics.perfectWeeks)", label: "Perfect Weeks")
            statCard(icon: "bolt", value: "\(analytics.completedCycles)", label: "Cycles Done")
        }
    }

    private func statCard(icon: String, value: String, label: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 20)).foregroundStyle(theme.accent)
            Text(value).font(.system(size: FontSize.large, weight: .bold)).foregroundStyle(theme.text)
            Text(label).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity).padding(16)
        .background(Rectangle().fill(theme.surface).overlay(Rectangle().stroke(theme.border, lineWidth: 1)))
    }

    private var insightsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionLabel(text: "Insights", theme: theme)
            VStack(spacing: 0) {
                insightItem("Average faults per week", analytics.avgFaultsPerWeek, color: theme.text)
                insightItem("Most practiced virtue", virtueName(analytics.mostPracticedVirtue), color: theme.text)
                insightItem("Strongest virtue", virtueName(analytics.strongestVirtue), color: theme.success)
                insightItem("Needs attention", virtueName(analytics.weakestVirtue), color: Color(hex: 0xC97B5D), last: true)
            }
        }
        .padding(.top, 24)
        .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
    }

    private func insightItem(_ label: String, _ value: String, color: Color, last: Bool = false) -> some View {
        HStack {
            Text(label).font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary)
            Spacer()
            Text(value).font(.system(size: FontSize.body, weight: .semibold)).foregroundStyle(color)
        }
        .padding(.vertical, 16)
        .overlay(alignment: .bottom) { if !last { Rectangle().fill(theme.borderLight).frame(height: 1) } }
    }

    private var trendSection: some View {
        let maxFaults = max(analytics.weeklyFaultTrend.map { $0.faults }.max() ?? 0, 7)
        return VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: "chart.line.uptrend.xyaxis").font(.system(size: 16)).foregroundStyle(theme.textTertiary)
                SectionLabel(text: "Recent Progress", theme: theme)
            }
            HStack(alignment: .bottom, spacing: 4) {
                ForEach(analytics.weeklyFaultTrend) { week in
                    VStack(spacing: 6) {
                        Text("\(week.faults)").font(.system(size: 11)).foregroundStyle(theme.textTertiary)
                        ZStack(alignment: .bottom) {
                            Rectangle().fill(theme.borderLight).frame(width: 24, height: 80).clipShape(RoundedRectangle(cornerRadius: 2))
                            Rectangle().fill(week.faults == 0 ? theme.success : theme.accent)
                                .frame(width: 24, height: max(CGFloat(week.faults) / CGFloat(maxFaults) * 80, 4))
                                .clipShape(RoundedRectangle(cornerRadius: 2))
                        }
                        Text(String(virtueName(week.virtueId).prefix(3))).font(.system(size: 10)).foregroundStyle(theme.textTertiary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.top, 8)
        }
    }

    private var breakdownSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel(text: "Virtue Breakdown", theme: theme).padding(.bottom, 16)
            ForEach(virtueStats.sorted { $0.attempts > $1.attempts }) { stat in
                let progress = stat.attempts > 0 ? Int(min((1 - stat.avgFaults / 7) * 100, 100).rounded()) : 0
                VStack(spacing: 12) {
                    HStack {
                        Text(Virtues.byId(stat.virtueId)?.name ?? stat.virtueId).font(.system(size: FontSize.label, weight: .bold)).foregroundStyle(theme.text)
                        Spacer()
                        Text("\(stat.attempts) \(stat.attempts == 1 ? "week" : "weeks") · avg \(String(format: "%.1f", stat.avgFaults)) faults")
                            .font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(theme.borderLight).frame(height: 4)
                            Capsule().fill(progress > 70 ? theme.success : theme.accent).frame(width: geo.size.width * CGFloat(progress) / 100, height: 4)
                        }
                    }.frame(height: 4)
                }
                .padding(.vertical, 16)
                .overlay(alignment: .bottom) { Rectangle().fill(theme.borderLight).frame(height: 1) }
            }
        }
        .padding(.top, 24)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.line.uptrend.xyaxis").font(.system(size: 48, weight: .ultraLight)).foregroundStyle(theme.textTertiary)
            Text("No data yet").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            Text("Complete your first week of practice to see analytics and insights about your journey.")
                .font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.center).lineSpacing(4).padding(.horizontal, 32)
        }
        .padding(.vertical, 80)
    }

    private func virtueName(_ id: String?) -> String {
        guard let id else { return "—" }
        return Virtues.byId(id)?.name ?? id
    }
}
