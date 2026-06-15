//
//  EthicaStore.swift
//  Ethica
//

import SwiftUI
import Observation

/// Central app state + persistence, mirroring `EthicaContext.tsx`.
@MainActor
@Observable
final class EthicaStore {
    private(set) var state = AppState()
    private(set) var isLoading = true

    private let storageKey = "ethica_state"

    private struct LastObservation {
        let date: String
        let previous: DailyObservation?
        let timestamp: Date
    }
    private var lastObservation: LastObservation?

    init() {
        load()
    }

    // MARK: - Persistence

    private func load() {
        defer { isLoading = false }
        guard let data = UserDefaults.standard.data(forKey: storageKey) else { return }
        do {
            var loaded = try JSONDecoder().decode(AppState.self, from: data)
            loaded = validateStreakOnLoad(loaded)
            state = loaded
        } catch {
            print("EthicaStore: failed to decode state — \(error)")
        }
    }

    private func persist() {
        do {
            let data = try JSONEncoder().encode(state)
            UserDefaults.standard.set(data, forKey: storageKey)
        } catch {
            print("EthicaStore: failed to encode state — \(error)")
        }
    }

    private func validateStreakOnLoad(_ loaded: AppState) -> AppState {
        let streak = loaded.streakData
        guard let lastLog = streak.lastLogDate, streak.currentStreak != 0 else { return loaded }
        guard let diff = DateKey.daysBetween(lastLog, DateKey.today) else { return loaded }
        if diff > 1 {
            var updated = loaded
            updated.streakData.currentStreak = 0
            return updated
        }
        return loaded
    }

    private func commit(_ mutate: (inout AppState) -> Void) {
        var copy = state
        mutate(&copy)
        state = copy
        persist()
    }

    // MARK: - Onboarding

    func completeOnboarding(virtueId: String) {
        let start = DateKey.today
        commit {
            $0.hasCompletedOnboarding = true
            $0.currentVirtueId = virtueId
            $0.currentWeekStartDate = start
            $0.startDate = start
        }
    }

    func markOnboardingSeen() {
        commit { $0.hasSeenOnboarding = true }
    }

    func updatePreferences(weekStartsMonday: Bool? = nil, darkMode: Bool? = nil, followSystemTheme: Bool? = nil) {
        commit {
            if let weekStartsMonday { $0.weekStartsMonday = weekStartsMonday }
            if let darkMode { $0.darkMode = darkMode }
            if let followSystemTheme { $0.followSystemTheme = followSystemTheme }
        }
    }

    // MARK: - Observations

    private func updatedStreakData(date: String, isNewLog: Bool) -> StreakData {
        let today = DateKey.today
        let yesterday = DateKey.adding(days: -1, to: today) ?? ""
        let lastLog = state.streakData.lastLogDate
        var newStreak = state.streakData.currentStreak
        var newTotal = state.streakData.totalDaysLogged

        if isNewLog {
            newTotal += 1
            if lastLog == nil || date == today || date == yesterday {
                if lastLog == yesterday || lastLog == today {
                    newStreak = state.streakData.currentStreak + 1
                } else if lastLog == nil {
                    newStreak = 1
                } else if let lastLog, let diff = DateKey.daysBetween(lastLog, date) {
                    newStreak = diff == 1 ? state.streakData.currentStreak + 1 : 1
                } else {
                    newStreak = 1
                }
            } else {
                newStreak = 1
            }
        }

        let resolvedLast: String?
        if let lastLog {
            resolvedLast = date > lastLog ? date : lastLog
        } else {
            resolvedLast = date
        }

        return StreakData(
            currentStreak: newStreak,
            longestStreak: max(state.streakData.longestStreak, newStreak),
            lastLogDate: resolvedLast,
            totalDaysLogged: newTotal,
            perfectWeeks: state.streakData.perfectWeeks
        )
    }

    func logObservation(date: String, hasFault: Bool, note: String?) {
        let existingIndex = state.currentWeekObservations.firstIndex { $0.date == date }
        let previous = existingIndex.map { state.currentWeekObservations[$0] }
        let isNewLog = existingIndex == nil

        var observations = state.currentWeekObservations
        if let existingIndex {
            observations[existingIndex] = DailyObservation(date: date, hasFault: hasFault, note: note)
        } else {
            observations.append(DailyObservation(date: date, hasFault: hasFault, note: note))
        }

        lastObservation = LastObservation(date: date, previous: previous, timestamp: Date())
        let newStreak = updatedStreakData(date: date, isNewLog: isNewLog)
        commit {
            $0.currentWeekObservations = observations
            $0.streakData = newStreak
        }
    }

    var currentWeekObservations: [DailyObservation] { state.currentWeekObservations }

    func observation(for date: String) -> DailyObservation? {
        state.currentWeekObservations.first { $0.date == date }
    }

    // MARK: - Week lifecycle

    func completeWeek(observations: [DailyObservation]) {
        guard let virtueId = state.currentVirtueId, let start = state.currentWeekStartDate else { return }
        let end = DateKey.adding(days: 6, to: start) ?? start
        let record = WeekRecord(virtueId: virtueId, startDate: start, endDate: end, observations: observations)
        let isPerfect = observations.count == 7 && observations.allSatisfy { !$0.hasFault }
        commit {
            $0.weekRecords.append(record)
            $0.currentVirtueId = nil
            $0.currentWeekStartDate = nil
            $0.currentWeekObservations = []
            $0.streakData.perfectWeeks += isPerfect ? 1 : 0
        }
    }

    func startNewWeek(virtueId: String) {
        let start = DateKey.today
        commit {
            $0.currentVirtueId = virtueId
            $0.currentWeekStartDate = start
            $0.currentWeekObservations = []
        }
    }

    var isWeekComplete: Bool {
        guard let start = state.currentWeekStartDate, let diff = DateKey.daysBetween(start, DateKey.today) else { return false }
        return diff >= 7
    }

    var daysRemainingInWeek: Int {
        guard let start = state.currentWeekStartDate, let diff = DateKey.daysBetween(start, DateKey.today) else { return 0 }
        return max(0, 7 - diff)
    }

    func virtueHistory(_ virtueId: String) -> [WeekRecord] {
        state.weekRecords.filter { $0.virtueId == virtueId }
    }

    // MARK: - Virtue queue

    func addToQueue(_ virtueId: String) {
        guard !state.virtueQueue.contains(virtueId) else { return }
        commit { $0.virtueQueue.append(virtueId) }
    }

    func removeFromQueue(_ virtueId: String) {
        commit { $0.virtueQueue.removeAll { $0 == virtueId } }
    }

    func reorderQueue(_ queue: [String]) {
        commit { $0.virtueQueue = queue }
    }

    var nextQueuedVirtue: String? { state.virtueQueue.first }

    @discardableResult
    func consumeQueuedVirtue() -> String? {
        guard let first = state.virtueQueue.first else { return nil }
        commit { $0.virtueQueue.removeFirst() }
        return first
    }

    // MARK: - Progress & analytics

    var cycleProgress: CycleProgress {
        let totalWeeks = state.weekRecords.count
        let cycleNumber = totalWeeks / 13 + 1
        let positionInCycle = (totalWeeks % 13) + (state.currentVirtueId != nil ? 1 : 0)
        let current = min(positionInCycle, 13)
        return CycleProgress(
            current: current,
            total: 13,
            percentage: Int((Double(current) / 13.0 * 100).rounded()),
            cycleNumber: cycleNumber
        )
    }

    func virtueStatistics() -> [VirtueStats] {
        var map: [String: VirtueStats] = [:]
        for record in state.weekRecords {
            let faults = record.observations.filter { $0.hasFault }.count
            if var existing = map[record.virtueId] {
                existing.attempts += 1
                existing.totalFaults += faults
                existing.avgFaults = Double(existing.totalFaults) / Double(existing.attempts)
                if existing.lastAttemptDate == nil || record.endDate > (existing.lastAttemptDate ?? "") {
                    existing.lastAttemptDate = record.endDate
                }
                map[record.virtueId] = existing
            } else {
                map[record.virtueId] = VirtueStats(
                    virtueId: record.virtueId,
                    attempts: 1,
                    totalFaults: faults,
                    avgFaults: Double(faults),
                    lastAttemptDate: record.endDate
                )
            }
        }
        return Array(map.values)
    }

    func virtuesNeedingImprovement() -> [String] {
        virtueStatistics()
            .filter { $0.attempts > 0 }
            .sorted { $0.avgFaults > $1.avgFaults }
            .prefix(3)
            .map { $0.virtueId }
    }

    func detailedAnalytics() -> DetailedAnalytics {
        let totalWeeks = state.weekRecords.count
        let totalFaults = state.weekRecords.reduce(0) { $0 + $1.observations.filter { $0.hasFault }.count }
        let totalObservations = state.weekRecords.reduce(0) { $0 + $1.observations.count } + state.currentWeekObservations.count
        let perfectWeeks = state.weekRecords.filter { $0.observations.count == 7 && $0.observations.allSatisfy { !$0.hasFault } }.count

        var attempts: [String: Int] = [:]
        var faults: [String: Int] = [:]
        for week in state.weekRecords {
            attempts[week.virtueId, default: 0] += 1
            faults[week.virtueId, default: 0] += week.observations.filter { $0.hasFault }.count
        }

        let mostPracticed = attempts.sorted { $0.value > $1.value }.first?.key
        let avgByVirtue = attempts.filter { $0.value > 0 }.map { (id: $0.key, avg: Double(faults[$0.key] ?? 0) / Double($0.value)) }
        let strongest = avgByVirtue.sorted { $0.avg < $1.avg }.first?.id
        let weakest = avgByVirtue.sorted { $0.avg > $1.avg }.first?.id

        let trend = state.weekRecords.suffix(8).map {
            WeeklyFaultPoint(
                weekStart: $0.startDate,
                virtueId: $0.virtueId,
                faults: $0.observations.filter { $0.hasFault }.count,
                observations: $0.observations.count
            )
        }

        let avgFaultsPerWeek = totalWeeks > 0 ? String(format: "%.1f", Double(totalFaults) / Double(totalWeeks)) : "0"
        let successRate = totalObservations > 0 ? Int((Double(totalObservations - totalFaults) / Double(totalObservations) * 100).rounded()) : 100

        return DetailedAnalytics(
            totalWeeks: totalWeeks,
            totalFaults: totalFaults,
            totalObservations: totalObservations,
            perfectWeeks: perfectWeeks,
            completedCycles: totalWeeks / 13,
            mostPracticedVirtue: mostPracticed,
            strongestVirtue: strongest,
            weakestVirtue: weakest,
            weeklyFaultTrend: Array(trend),
            avgFaultsPerWeek: avgFaultsPerWeek,
            successRate: successRate
        )
    }

    var daysSincePracticing: Int {
        guard let start = state.startDate, let diff = DateKey.daysBetween(start, DateKey.today) else { return 0 }
        return max(0, diff)
    }

    // MARK: - Journal

    @discardableResult
    func addJournalEntry(content: String, mood: JournalMood?, tags: [String]? = nil) -> JournalEntry {
        let now = ISO8601DateFormatter().string(from: Date())
        let entry = JournalEntry(
            id: "journal_\(Int(Date().timeIntervalSince1970 * 1000))_\(UUID().uuidString.prefix(6))",
            content: content,
            createdAt: now,
            updatedAt: now,
            mood: mood,
            tags: tags
        )
        commit { $0.journalEntries.insert(entry, at: 0) }
        return entry
    }

    func updateJournalEntry(id: String, content: String, mood: JournalMood?) {
        let now = ISO8601DateFormatter().string(from: Date())
        commit {
            if let idx = $0.journalEntries.firstIndex(where: { $0.id == id }) {
                $0.journalEntries[idx].content = content
                $0.journalEntries[idx].mood = mood
                $0.journalEntries[idx].updatedAt = now
            }
        }
    }

    func deleteJournalEntry(id: String) {
        commit { $0.journalEntries.removeAll { $0.id == id } }
    }

    var journalEntries: [JournalEntry] { state.journalEntries }

    // MARK: - Custom virtues

    @discardableResult
    func addCustomVirtue(name: String, description: String, context: String) -> CustomVirtue {
        let now = ISO8601DateFormatter().string(from: Date())
        let virtue = CustomVirtue(
            id: "custom_\(Int(Date().timeIntervalSince1970 * 1000))_\(UUID().uuidString.prefix(6))",
            name: name,
            description: description,
            context: context,
            createdAt: now
        )
        commit { $0.customVirtues.append(virtue) }
        return virtue
    }

    func deleteCustomVirtue(id: String) {
        commit { $0.customVirtues.removeAll { $0.id == id } }
    }

    var customVirtues: [CustomVirtue] { state.customVirtues }

    /// Custom virtues exposed in the shared `Virtue` shape for selection screens.
    var customVirtuesAsVirtues: [Virtue] {
        state.customVirtues.map {
            Virtue(
                id: $0.id,
                name: $0.name,
                description: $0.description,
                fullDescription: $0.description,
                context: $0.context.isEmpty ? "A custom virtue for personal growth." : $0.context,
                quote: "",
                isCustom: true
            )
        }
    }

    func resetData() {
        state = AppState()
        persist()
    }
}
