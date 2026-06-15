//
//  HomeView.swift
//  Ethica
//

import SwiftUI

struct HomeView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var showInfoModal = false
    @State private var showLog = false
    @State private var showWeekCompleteAlert = false
    @State private var didCheckWeekComplete = false

    private var currentVirtue: Virtue? { Virtues.byId(store.state.currentVirtueId) }
    private var observations: [DailyObservation] { store.currentWeekObservations }
    private var streak: StreakData { store.state.streakData }
    private var cycle: CycleProgress { store.cycleProgress }
    private var isFirstWeek: Bool { store.state.weekRecords.isEmpty }
    private var weekComplete: Bool { store.isWeekComplete }

    private var dayLabels: [String] {
        store.state.weekStartsMonday
            ? ["M", "T", "W", "T", "F", "S", "S"]
            : ["S", "M", "T", "W", "T", "F", "S"]
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            if let currentVirtue {
                content(currentVirtue)
                    .frame(maxWidth: 860)
                    .frame(maxWidth: .infinity)
            } else {
                emptyState
            }
        }
        .sheet(isPresented: $showInfoModal) {
            FranklinMethodSheet()
                .environment(\.theme, theme)
        }
        .sheet(isPresented: $showLog) {
            LogObservationView()
                .environment(\.theme, theme)
        }
        .alert("Week Complete", isPresented: $showWeekCompleteAlert) {
            Button("Later", role: .cancel) {}
            Button("Review Now") { router.push(.weekReview) }
        } message: {
            Text("Your week of practicing \(currentVirtue?.name ?? "this virtue") is ready for review. Would you like to reflect on your progress?")
        }
        .onAppear {
            if weekComplete && currentVirtue != nil && !didCheckWeekComplete {
                didCheckWeekComplete = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { showWeekCompleteAlert = true }
            }
        }
    }

    private func content(_ virtue: Virtue) -> some View {
        VStack(spacing: 0) {
            header
            VStack(spacing: 0) {
                virtueSection(virtue)

                if weekComplete {
                    weekCompleteBanner
                        .padding(.top, 8)
                } else if isFirstWeek {
                    firstWeekTip
                        .padding(.top, 8)
                }

                Spacer(minLength: 0)
                weekGrid.padding(.vertical, 48)
                Spacer(minLength: 0)

                footer
            }
            .padding(.horizontal, 20)
        }
    }

    private var header: some View {
        HStack {
            Button { router.push(.settings) } label: {
                Image(systemName: "line.3.horizontal").font(.system(size: 22, weight: .regular)).foregroundStyle(theme.text)
            }
            Spacer()
            VStack(spacing: 4) {
                HStack(spacing: 20) {
                    iconButton("feather") { router.push(.personalJournal) }
                    iconButton("book") { router.push(.journal) }
                    iconButton("chart.bar") { router.push(.analytics) }
                }
                HStack(spacing: 4) {
                    Image(systemName: "internaldrive").font(.system(size: 9)).foregroundStyle(theme.textTertiary)
                    Text("Saved locally")
                        .font(.system(size: 9))
                        .tracking(0.3)
                        .foregroundStyle(theme.textTertiary)
                }
            }
            Spacer()
            Button { router.push(.profile) } label: {
                Image(systemName: "person").font(.system(size: 22, weight: .regular)).foregroundStyle(theme.text)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 16)
    }

    private func iconButton(_ systemName: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName).font(.system(size: 22, weight: .regular)).foregroundStyle(theme.text)
        }
    }

    private func virtueSection(_ virtue: Virtue) -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                if streak.currentStreak > 0 {
                    HStack(spacing: 6) {
                        Image(systemName: "flame.fill").font(.system(size: 14)).foregroundStyle(Color(hex: 0xE8834A))
                        Text("\(streak.currentStreak)").font(.system(size: FontSize.label, weight: .semibold)).foregroundStyle(theme.text)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(Capsule().fill(theme.surface).overlay(Capsule().stroke(theme.border, lineWidth: 1)))
                }
                progressRing
                if streak.longestStreak > 0 && streak.longestStreak > streak.currentStreak {
                    VStack(spacing: 2) {
                        Text("BEST").font(.system(size: 9)).tracking(0.5).foregroundStyle(theme.textTertiary)
                        Text("\(streak.longestStreak)").font(.system(size: FontSize.caption, weight: .semibold)).foregroundStyle(theme.text)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Capsule().fill(theme.surface).overlay(Capsule().stroke(theme.border, lineWidth: 1)))
                }
            }
            Text(virtue.name)
                .font(.system(size: FontSize.xlarge, weight: .bold))
                .foregroundStyle(theme.text)
                .multilineTextAlignment(.center)
            Text(virtue.fullDescription)
                .font(.system(size: FontSize.body))
                .foregroundStyle(theme.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(6)
                .padding(.horizontal, 16)
            Text("THIS WEEK'S OBSERVATION")
                .font(.system(size: FontSize.caption, weight: .medium))
                .tracking(1)
                .foregroundStyle(theme.textTertiary)
                .padding(.top, 8)
        }
        .padding(.top, 32)
    }

    private var progressRing: some View {
        ZStack {
            Circle().stroke(theme.borderLight, lineWidth: 3).frame(width: 80, height: 80)
            Circle()
                .trim(from: 0, to: CGFloat(cycle.percentage) / 100)
                .stroke(theme.accent, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .frame(width: 80, height: 80)
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(cycle.current)").font(.system(size: 24, weight: .bold)).foregroundStyle(theme.text)
                Text("of 13").font(.system(size: 11)).foregroundStyle(theme.textTertiary)
            }
        }
    }

    private var weekCompleteBanner: some View {
        Button { router.push(.weekReview) } label: {
            HStack(spacing: 12) {
                Image(systemName: "checkmark.circle").font(.system(size: 20)).foregroundStyle(.white)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Week Complete").font(.system(size: FontSize.label, weight: .semibold)).foregroundStyle(.white)
                    Text("Tap to review and choose your next virtue").font(.system(size: FontSize.caption)).foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
            }
            .padding(.horizontal, 20).padding(.vertical, 16)
            .frame(maxWidth: .infinity)
            .background(theme.accent)
        }
        .buttonStyle(PressableStyle())
        .padding(.horizontal, -20)
    }

    private var firstWeekTip: some View {
        Button { showInfoModal = true } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "info.circle").font(.system(size: 14)).foregroundStyle(theme.accent)
                    Text("YOUR FIRST WEEK").font(.system(size: FontSize.caption, weight: .semibold)).tracking(0.5).foregroundStyle(theme.accent)
                }
                Text("Franklin quietly noted each fault on his virtue chart. Tap to explore his method.")
                    .font(.system(size: FontSize.caption))
                    .foregroundStyle(theme.textSecondary)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.vertical, 12).padding(.horizontal, 16)
            .background(RoundedRectangle(cornerRadius: 8).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 8).stroke(theme.accent, lineWidth: 1)))
            .padding(.horizontal, 12)
        }
        .buttonStyle(PressableStyle())
    }

    private var weekGrid: some View {
        HStack(spacing: 14) {
            ForEach(0..<7, id: \.self) { dayIndex in
                dayCell(dayIndex)
            }
        }
    }

    private func dayCell(_ dayIndex: Int) -> some View {
        let today = DateKey.today
        var dateStr = ""
        var isToday = false
        var isFuture = false
        if let start = store.state.currentWeekStartDate, let str = DateKey.adding(days: dayIndex, to: start) {
            dateStr = str
            isToday = str == today
            isFuture = str > today
        }
        let obs = observations.first { $0.date == dateStr }
        let isLogged = obs != nil
        let hasFault = obs?.hasFault ?? false

        return Button {
            Haptics.light()
            showLog = true
        } label: {
            VStack(spacing: 8) {
                Text(dayLabels[dayIndex])
                    .font(.system(size: FontSize.caption, weight: .medium))
                    .foregroundStyle(isToday ? theme.accent : theme.textTertiary)
                Rectangle()
                    .fill(isLogged && !hasFault ? theme.text : Color.clear)
                    .frame(width: 40, height: 40)
                    .overlay(Rectangle().stroke(isToday ? theme.accent : theme.border, lineWidth: isToday ? 2 : 1))
                    .overlay {
                        if hasFault { Circle().fill(theme.faultDot).frame(width: 6, height: 6) }
                    }
                    .opacity(isFuture ? 0.4 : 1)
            }
        }
        .buttonStyle(PressableStyle())
        .disabled(isFuture)
    }

    private var footer: some View {
        VStack(spacing: 16) {
            OutlineButton(title: "Log Observation", theme: theme) { showLog = true }
            if store.state.currentWeekStartDate != nil {
                Button { router.push(.weekReview) } label: {
                    Text("Complete Week").font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary)
                }
                .buttonStyle(PressableStyle())
            }
        }
        .padding(.bottom, 32)
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("No virtue selected").font(.system(size: FontSize.large, weight: .bold)).foregroundStyle(theme.text)
            Text("Select a virtue to begin your week of practice.")
                .font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.center)
            OutlineButton(title: "Select Virtue", theme: theme) { router.popToRoot() }
                .padding(.top, 24).frame(maxWidth: 280)
        }
        .padding(.horizontal, 32)
    }
}


