//
//  EthicaModels.swift
//  Ethica
//

import Foundation

nonisolated struct DailyObservation: Codable, Hashable, Identifiable {
    var date: String
    var hasFault: Bool
    var note: String?

    var id: String { date }
}

nonisolated struct WeekRecord: Codable, Hashable, Identifiable {
    var virtueId: String
    var startDate: String
    var endDate: String
    var observations: [DailyObservation]

    var id: String { "\(virtueId)-\(startDate)" }
}

nonisolated struct StreakData: Codable, Hashable {
    var currentStreak: Int = 0
    var longestStreak: Int = 0
    var lastLogDate: String?
    var totalDaysLogged: Int = 0
    var perfectWeeks: Int = 0
}

nonisolated enum JournalMood: String, Codable, CaseIterable, Identifiable {
    case reflective
    case grateful
    case challenged
    case inspired
    case peaceful

    var id: String { rawValue }

    var label: String {
        rawValue.prefix(1).uppercased() + rawValue.dropFirst()
    }
}

nonisolated struct JournalEntry: Codable, Hashable, Identifiable {
    var id: String
    var content: String
    var createdAt: String
    var updatedAt: String
    var mood: JournalMood?
    var tags: [String]?
}

nonisolated struct CustomVirtue: Codable, Hashable, Identifiable {
    var id: String
    var name: String
    var description: String
    var context: String
    var createdAt: String
}

nonisolated struct AppState: Codable {
    var hasCompletedOnboarding: Bool = false
    var hasSeenOnboarding: Bool = false
    var currentVirtueId: String?
    var currentWeekStartDate: String?
    var weekRecords: [WeekRecord] = []
    var currentWeekObservations: [DailyObservation] = []
    var userName: String?
    var startDate: String?
    var weekStartsMonday: Bool = true
    var darkMode: Bool = false
    var followSystemTheme: Bool = false
    var virtueQueue: [String] = []
    var streakData: StreakData = StreakData()
    var journalEntries: [JournalEntry] = []
    var customVirtues: [CustomVirtue] = []
}

/// Aggregate analytics computed from week records.
nonisolated struct DetailedAnalytics {
    var totalWeeks: Int
    var totalFaults: Int
    var totalObservations: Int
    var perfectWeeks: Int
    var completedCycles: Int
    var mostPracticedVirtue: String?
    var strongestVirtue: String?
    var weakestVirtue: String?
    var weeklyFaultTrend: [WeeklyFaultPoint]
    var avgFaultsPerWeek: String
    var successRate: Int
}

nonisolated struct WeeklyFaultPoint: Identifiable {
    var weekStart: String
    var virtueId: String
    var faults: Int
    var observations: Int

    var id: String { weekStart }
}

nonisolated struct VirtueStats: Identifiable {
    var virtueId: String
    var attempts: Int
    var totalFaults: Int
    var avgFaults: Double
    var lastAttemptDate: String?

    var id: String { virtueId }
}

nonisolated struct CycleProgress {
    var current: Int
    var total: Int
    var percentage: Int
    var cycleNumber: Int
}

/// Shared date helpers matching the JS app's ISO `YYYY-MM-DD` keys.
nonisolated enum DateKey {
    static var formatter: DateFormatter {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone.current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }

    static func string(from date: Date) -> String {
        formatter.string(from: date)
    }

    static func date(from key: String) -> Date? {
        formatter.date(from: key)
    }

    static var today: String { string(from: Date()) }

    static func adding(days: Int, to key: String) -> String? {
        guard let base = date(from: key) else { return nil }
        guard let next = Calendar.current.date(byAdding: .day, value: days, to: base) else { return nil }
        return string(from: next)
    }

    static func daysBetween(_ start: String, _ end: String) -> Int? {
        guard let s = date(from: start), let e = date(from: end) else { return nil }
        let cal = Calendar.current
        let sd = cal.startOfDay(for: s)
        let ed = cal.startOfDay(for: e)
        return cal.dateComponents([.day], from: sd, to: ed).day
    }
}
