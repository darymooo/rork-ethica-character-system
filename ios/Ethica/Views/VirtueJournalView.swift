//
//  VirtueJournalView.swift
//  Ethica
//

import SwiftUI

/// History of completed week records (the RN `journal.tsx`).
struct VirtueJournalView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var selectedFilter: String?
    @State private var showStats = true

    private var sortedRecords: [WeekRecord] {
        store.state.weekRecords.sorted { ($0.startDate) > ($1.startDate) }
    }
    private var filteredRecords: [WeekRecord] {
        guard let selectedFilter else { return sortedRecords }
        return sortedRecords.filter { $0.virtueId == selectedFilter }
    }
    private var practiced: [Virtue] {
        Virtues.all.filter { v in store.state.weekRecords.contains { $0.virtueId == v.id } }
    }

    private var dayLabels: [String] {
        store.state.weekStartsMonday ? ["M","T","W","T","F","S","S"] : ["S","M","T","W","T","F","S"]
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Journal", theme: theme, trailing: AnyView(
                    Button { withAnimation { showStats.toggle() } } label: {
                        Image(systemName: "chart.line.uptrend.xyaxis").font(.system(size: 20)).foregroundStyle(showStats ? theme.accent : theme.textTertiary)
                    }
                )) { router.pop() }

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        if showStats && !sortedRecords.isEmpty { statsCard }
                        if !sortedRecords.isEmpty { filterBar }
                        if filteredRecords.isEmpty { emptyState }
                        else { ForEach(filteredRecords) { recordCard($0) } }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 32)
                    .frame(maxWidth: 760)
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    private var statsCard: some View {
        let totalWeeks = store.state.weekRecords.count
        let totalFaults = store.state.weekRecords.reduce(0) { $0 + $1.observations.filter { $0.hasFault }.count }
        let avg = totalWeeks > 0 ? String(format: "%.1f", Double(totalFaults) / Double(totalWeeks)) : "0"
        return VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 8) {
                Image(systemName: "chart.line.uptrend.xyaxis").font(.system(size: 20)).foregroundStyle(theme.text)
                Text("Your Progress").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            }
            HStack(spacing: 16) {
                statItem("\(totalWeeks)", "Weeks Completed")
                statItem(avg, "Avg Faults/Week")
                statItem("\(practiced.count)", "Virtues Practiced")
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Rectangle().fill(theme.surface).overlay(Rectangle().stroke(theme.border, lineWidth: 1)))
    }

    private func statItem(_ value: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 32, weight: .bold)).foregroundStyle(theme.text)
            Text(label).font(.system(size: FontSize.caption)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    private var filterBar: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "line.3.horizontal.decrease").font(.system(size: 16)).foregroundStyle(theme.textTertiary)
                SectionLabel(text: "Filter by Virtue", theme: theme)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    chip("All", active: selectedFilter == nil) { selectedFilter = nil }
                    ForEach(practiced) { virtue in
                        chip(virtue.name, active: selectedFilter == virtue.id) { selectedFilter = virtue.id }
                    }
                }
            }
        }
    }

    private func chip(_ title: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button { Haptics.selection(); action() } label: {
            Text(title).font(.system(size: FontSize.caption, weight: .medium))
                .foregroundStyle(active ? .white : theme.text)
                .padding(.vertical, 8).padding(.horizontal, 16)
                .background(Capsule().fill(active ? theme.accent : theme.surface).overlay(Capsule().stroke(active ? theme.accent : theme.border, lineWidth: 1)))
        }
        .buttonStyle(PressableStyle())
    }

    private func recordCard(_ record: WeekRecord) -> some View {
        let virtue = Virtues.byId(record.virtueId)
        let faultCount = record.observations.filter { $0.hasFault }.count
        let notes = record.observations.filter { $0.note != nil && !($0.note ?? "").isEmpty }
        return VStack(spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(virtue?.name ?? record.virtueId).font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
                    Text(dateRange(record.startDate, record.endDate)).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(faultCount)").font(.system(size: 28, weight: .bold)).foregroundStyle(theme.text)
                    Text(faultCount == 1 ? "fault" : "faults").font(.system(size: FontSize.caption)).foregroundStyle(theme.textSecondary)
                }
            }

            HStack(spacing: 10) {
                ForEach(0..<7, id: \.self) { dayIndex in
                    let dateStr = DateKey.adding(days: dayIndex, to: record.startDate) ?? ""
                    let obs = record.observations.first { $0.date == dateStr }
                    VStack(spacing: 6) {
                        Text(dayLabels[dayIndex]).font(.system(size: FontSize.caption, weight: .medium)).foregroundStyle(theme.textTertiary)
                        Rectangle().stroke(theme.border, lineWidth: 1).frame(width: 32, height: 32)
                            .overlay { if obs?.hasFault == true { Circle().fill(theme.faultDot).frame(width: 6, height: 6) } }
                    }
                }
            }

            if !notes.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    SectionLabel(text: "Notes", theme: theme)
                    ForEach(notes) { obs in
                        HStack(alignment: .top, spacing: 8) {
                            Text(weekday(obs.date) + ":").font(.system(size: FontSize.body, weight: .medium)).foregroundStyle(theme.textSecondary).frame(width: 40, alignment: .leading)
                            Text(obs.note ?? "").font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).lineSpacing(4)
                            Spacer(minLength: 0)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 16)
                .overlay(alignment: .top) { Rectangle().fill(theme.borderLight).frame(height: 1) }
            }
        }
        .padding(20)
        .background(Rectangle().fill(theme.surface).overlay(Rectangle().stroke(theme.border, lineWidth: 1)))
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bookmark").font(.system(size: 48, weight: .light)).foregroundStyle(theme.textTertiary)
            Text("Begin your first week").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            Text("Complete your first week to see your progress here. Each completed week becomes part of your historical record.")
                .font(.system(size: FontSize.body)).foregroundStyle(theme.textTertiary).multilineTextAlignment(.center).lineSpacing(4).padding(.horizontal, 16)
        }
        .padding(.vertical, 80)
    }

    private func dateRange(_ start: String, _ end: String) -> String {
        guard let s = DateKey.date(from: start), let e = DateKey.date(from: end) else { return "" }
        let mf = DateFormatter(); mf.dateFormat = "MMM"
        let yf = DateFormatter(); yf.dateFormat = "yyyy"
        let cal = Calendar.current
        let sDay = cal.component(.day, from: s); let eDay = cal.component(.day, from: e)
        let sMonth = mf.string(from: s); let eMonth = mf.string(from: e)
        if sMonth == eMonth { return "\(sMonth) \(sDay)–\(eDay), \(yf.string(from: s))" }
        return "\(sMonth) \(sDay) – \(eMonth) \(eDay), \(yf.string(from: s))"
    }

    private func weekday(_ dateStr: String) -> String {
        guard let d = DateKey.date(from: dateStr) else { return "" }
        let f = DateFormatter(); f.dateFormat = "EEE"
        return f.string(from: d)
    }
}
