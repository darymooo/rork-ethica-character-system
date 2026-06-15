//
//  PersonalJournalView.swift
//  Ethica
//

import SwiftUI

struct PersonalJournalView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var isSearching = false
    @State private var searchQuery = ""
    @State private var showComposer = false
    @State private var editingEntry: JournalEntry?
    @State private var pendingDelete: JournalEntry?

    private var entries: [JournalEntry] { store.journalEntries }

    private var filtered: [JournalEntry] {
        guard !searchQuery.trimmingCharacters(in: .whitespaces).isEmpty else { return entries }
        let q = searchQuery.lowercased()
        return entries.filter { $0.content.lowercased().contains(q) || ($0.mood?.rawValue.lowercased().contains(q) ?? false) }
    }

    private var grouped: [(String, [JournalEntry])] {
        var order: [String] = []
        var dict: [String: [JournalEntry]] = [:]
        let iso = ISO8601DateFormatter()
        for entry in filtered {
            let date = iso.date(from: entry.createdAt) ?? Date()
            let key = groupKey(for: date)
            if dict[key] == nil { order.append(key); dict[key] = [] }
            dict[key]?.append(entry)
        }
        return order.map { ($0, dict[$0] ?? []) }
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                if isSearching { searchBar }
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 24) {
                        if grouped.isEmpty { emptyState }
                        else {
                            ForEach(grouped, id: \.0) { label, dayEntries in
                                VStack(alignment: .leading, spacing: 12) {
                                    Text(label.uppercased()).font(.system(size: FontSize.caption, weight: .medium)).tracking(0.5).foregroundStyle(theme.textTertiary).padding(.leading, 4)
                                    ForEach(dayEntries) { entry in entryCard(entry) }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 100)
                    .frame(maxWidth: 760)
                    .frame(maxWidth: .infinity)
                }
            }

            if !entries.isEmpty {
                Button { openComposer(nil) } label: {
                    Image(systemName: "plus").font(.system(size: 24, weight: .bold)).foregroundStyle(theme.background)
                        .frame(width: 56, height: 56).background(Circle().fill(theme.text)).shadow(color: .black.opacity(0.2), radius: 12, y: 4)
                }
                .buttonStyle(PressableStyle())
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                .padding(24)
            }
        }
        .sheet(isPresented: $showComposer) {
            JournalComposer(editingEntry: editingEntry) { content, mood in
                if let editing = editingEntry {
                    store.updateJournalEntry(id: editing.id, content: content, mood: mood)
                } else {
                    store.addJournalEntry(content: content, mood: mood)
                }
            }
            .environment(\.theme, theme)
            .presentationDetents([.medium, .large])
        }
        .alert("Delete Entry", isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } })) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                if let e = pendingDelete { Haptics.warning(); store.deleteJournalEntry(id: e.id) }
                pendingDelete = nil
            }
        } message: { Text("Are you sure you want to delete this journal entry?") }
    }

    private var header: some View {
        HStack {
            Button { router.pop() } label: {
                Image(systemName: "arrow.left").font(.system(size: 20, weight: .medium)).foregroundStyle(theme.text).frame(width: 36, height: 36)
            }
            Spacer()
            VStack(spacing: 2) {
                Text("Journal").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
                Text("\(entries.count) \(entries.count == 1 ? "entry" : "entries")").font(.system(size: 11)).foregroundStyle(theme.textTertiary)
            }
            Spacer()
            Button { withAnimation { isSearching.toggle(); if !isSearching { searchQuery = "" } } } label: {
                Image(systemName: isSearching ? "xmark" : "magnifyingglass").font(.system(size: 20)).foregroundStyle(isSearching ? theme.accent : theme.textTertiary).frame(width: 36, height: 36)
            }
        }
        .padding(.horizontal, 24).padding(.vertical, 16)
    }

    private var searchBar: some View {
        HStack(spacing: 12) {
            Image(systemName: "magnifyingglass").font(.system(size: 16)).foregroundStyle(theme.textTertiary)
            TextField("Search your thoughts...", text: $searchQuery).font(.system(size: FontSize.body)).foregroundStyle(theme.text)
            if !searchQuery.isEmpty {
                Button { searchQuery = "" } label: { Image(systemName: "xmark").font(.system(size: 16)).foregroundStyle(theme.textTertiary) }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 8).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 8).stroke(theme.border, lineWidth: 1)))
        .padding(.horizontal, 24).padding(.bottom, 16)
    }

    private func entryCard(_ entry: JournalEntry) -> some View {
        Button { openComposer(entry) } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    if let mood = entry.mood {
                        HStack(spacing: 5) {
                            Image(systemName: moodIcon(mood)).font(.system(size: 12)).foregroundStyle(moodColor(mood))
                            Text(mood.label).font(.system(size: 11, weight: .medium)).foregroundStyle(moodColor(mood))
                        }
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(Capsule().fill(moodColor(mood).opacity(0.12)))
                    }
                    Text(time(entry.createdAt)).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
                    Spacer()
                    Menu {
                        Button { openComposer(entry) } label: { Label("Edit", systemImage: "pencil") }
                        Button(role: .destructive) { pendingDelete = entry } label: { Label("Delete", systemImage: "trash") }
                    } label: {
                        Image(systemName: "ellipsis").font(.system(size: 18)).foregroundStyle(theme.textTertiary).padding(4)
                    }
                }
                Text(entry.content).font(.system(size: FontSize.body)).foregroundStyle(theme.text).lineSpacing(6).lineLimit(6).multilineTextAlignment(.leading).frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(16)
            .background(Rectangle().fill(theme.surface).overlay(Rectangle().stroke(theme.border, lineWidth: 1)))
        }
        .buttonStyle(PressableStyle())
    }

    private var emptyState: some View {
        VStack(spacing: 0) {
            ZStack { Circle().fill(theme.surface).frame(width: 88, height: 88); Image(systemName: "feather").font(.system(size: 40, weight: .light)).foregroundStyle(theme.textTertiary) }
                .padding(.bottom, 24)
            Text("Your journal awaits").font(.system(size: FontSize.large, weight: .bold)).foregroundStyle(theme.text).padding(.bottom, 12)
            Text("Capture your thoughts, reflections, and ideas. Every entry becomes part of your personal story.")
                .font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.center).lineSpacing(6).padding(.bottom, 32)
            Button { openComposer(nil) } label: {
                HStack(spacing: 8) {
                    Image(systemName: "plus").font(.system(size: 18, weight: .bold)).foregroundStyle(theme.text)
                    Text("Write First Entry").font(.system(size: FontSize.label, weight: .semibold)).foregroundStyle(theme.text)
                }
                .padding(.vertical, 14).padding(.horizontal, 24)
                .background(RoundedRectangle(cornerRadius: 12).stroke(theme.border, lineWidth: 1))
            }
            .buttonStyle(PressableStyle())
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 80).padding(.horizontal, 32)
    }

    private func openComposer(_ entry: JournalEntry?) {
        Haptics.light()
        editingEntry = entry
        showComposer = true
    }

    private func groupKey(for date: Date) -> String {
        let cal = Calendar.current
        if cal.isDateInToday(date) { return "Today" }
        if cal.isDateInYesterday(date) { return "Yesterday" }
        let f = DateFormatter()
        if cal.component(.year, from: date) == cal.component(.year, from: Date()) {
            f.dateFormat = "MMMM d"
        } else {
            f.dateFormat = "MMMM d, yyyy"
        }
        return f.string(from: date)
    }

    private func time(_ iso: String) -> String {
        let date = ISO8601DateFormatter().date(from: iso) ?? Date()
        let f = DateFormatter(); f.dateFormat = "h:mm a"
        return f.string(from: date)
    }

    private func moodIcon(_ mood: JournalMood) -> String {
        switch mood {
        case .reflective: return "feather"
        case .grateful: return "heart"
        case .inspired: return "sparkles"
        case .challenged: return "mountain.2"
        case .peaceful: return "cloud"
        }
    }

    private func moodColor(_ mood: JournalMood) -> Color {
        switch mood {
        case .grateful: return Color(hex: 0xE8834A)
        case .inspired: return Color(hex: 0x9B8AC4)
        case .challenged: return Color(hex: 0x6B8E7A)
        case .peaceful: return Color(hex: 0x7BA3C9)
        case .reflective: return theme.accent
        }
    }
}

/// Bottom-sheet composer for creating/editing journal entries.
private struct JournalComposer: View {
    let editingEntry: JournalEntry?
    let onSave: (String, JournalMood?) -> Void

    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss
    @FocusState private var focused: Bool

    @State private var text = ""
    @State private var mood: JournalMood?

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Button { dismiss() } label: { Image(systemName: "xmark").font(.system(size: 22)).foregroundStyle(theme.textTertiary) }
                Spacer()
                Text(editingEntry == nil ? "New Entry" : "Edit Entry").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
                Spacer()
                Button {
                    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmed.isEmpty else { return }
                    Haptics.success()
                    onSave(trimmed, mood)
                    dismiss()
                } label: {
                    Image(systemName: "checkmark").font(.system(size: 18, weight: .bold)).foregroundStyle(theme.background)
                        .frame(width: 36, height: 36).background(Circle().fill(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? theme.disabled : theme.text))
                }
                .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(JournalMood.allCases) { m in
                        let selected = mood == m
                        Button { Haptics.selection(); mood = selected ? nil : m } label: {
                            HStack(spacing: 6) {
                                Image(systemName: moodIcon(m)).font(.system(size: 14)).foregroundStyle(selected ? moodColor(m) : theme.textSecondary)
                                Text(m.label).font(.system(size: FontSize.caption, weight: .medium)).foregroundStyle(selected ? moodColor(m) : theme.textSecondary)
                            }
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(Capsule().fill(selected ? moodColor(m).opacity(0.12) : theme.surface).overlay(Capsule().stroke(selected ? moodColor(m) : theme.border, lineWidth: 1)))
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
            }

            TextField("What's on your mind?", text: $text, axis: .vertical)
                .focused($focused)
                .font(.system(size: FontSize.body))
                .foregroundStyle(theme.text)
                .lineSpacing(6)
                .frame(maxWidth: .infinity, minHeight: 120, alignment: .topLeading)
            Spacer()
        }
        .padding(24)
        .background(theme.background)
        .toolbar { ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("Done") { focused = false } } }
        .onAppear {
            text = editingEntry?.content ?? ""
            mood = editingEntry?.mood
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { focused = true }
        }
    }

    private func moodIcon(_ mood: JournalMood) -> String {
        switch mood {
        case .reflective: return "feather"
        case .grateful: return "heart"
        case .inspired: return "sparkles"
        case .challenged: return "mountain.2"
        case .peaceful: return "cloud"
        }
    }

    private func moodColor(_ mood: JournalMood) -> Color {
        switch mood {
        case .grateful: return Color(hex: 0xE8834A)
        case .inspired: return Color(hex: 0x9B8AC4)
        case .challenged: return Color(hex: 0x6B8E7A)
        case .peaceful: return Color(hex: 0x7BA3C9)
        case .reflective: return theme.accent
        }
    }
}
