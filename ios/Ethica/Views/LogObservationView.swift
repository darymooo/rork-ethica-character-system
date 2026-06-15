//
//  LogObservationView.swift
//  Ethica
//

import SwiftUI

struct LogObservationView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss
    @FocusState private var noteFocused: Bool

    @State private var hasFault: Bool?
    @State private var note = ""
    @State private var showToast = false
    @State private var initialized = false

    private let today = DateKey.today
    private var currentVirtue: Virtue? { Virtues.byId(store.state.currentVirtueId) }
    private var existing: DailyObservation? { store.observation(for: today) }
    private var isEditing: Bool { existing != nil }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        Text(longDate)
                            .font(.system(size: FontSize.caption, weight: .medium))
                            .tracking(1)
                            .foregroundStyle(theme.textTertiary)
                            .padding(.bottom, 20)

                        if let currentVirtue {
                            virtueCard(currentVirtue)
                        }

                        questionSection
                        optionsSection
                        if hasFault == true { noteSection }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 8)
                    .frame(maxWidth: 600)
                    .frame(maxWidth: .infinity)
                }
                footer
            }

            if showToast { toast }
        }
        .onAppear {
            guard !initialized else { return }
            initialized = true
            hasFault = existing?.hasFault
            note = existing?.note ?? ""
        }
    }

    private var header: some View {
        HStack {
            Color.clear.frame(width: 24, height: 24)
            Spacer()
            Text("Observation").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            Spacer()
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 20, weight: .regular)).foregroundStyle(theme.text)
            }
        }
        .padding(.horizontal, 24).padding(.vertical, 16)
    }

    private var longDate: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMMM d"
        return f.string(from: Date()).uppercased()
    }

    private func virtueCard(_ virtue: Virtue) -> some View {
        VStack(spacing: 12) {
            Text(virtue.name).font(.system(size: FontSize.xlarge, weight: .bold)).foregroundStyle(theme.text)
            Rectangle().fill(theme.border).frame(width: 40, height: 1)
            Text("“\(virtue.description)”")
                .font(.system(size: FontSize.body, weight: .medium))
                .italic()
                .foregroundStyle(theme.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(6)
        }
        .padding(.vertical, 20).padding(.horizontal, 24)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 8).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 8).stroke(theme.borderLight, lineWidth: 1)))
        .padding(.bottom, 28)
    }

    private var questionSection: some View {
        VStack(spacing: 6) {
            Text("TODAY'S REFLECTION").font(.system(size: FontSize.caption, weight: .medium)).tracking(0.5).foregroundStyle(theme.textTertiary)
            Text("Did you uphold this virtue?").font(.system(size: FontSize.large, weight: .bold)).foregroundStyle(theme.text).multilineTextAlignment(.center)
        }
        .padding(.bottom, 24)
    }

    private var optionsSection: some View {
        VStack(spacing: 12) {
            optionButton(
                selected: hasFault == false,
                accentColor: theme.success,
                icon: "checkmark",
                title: "Yes, I did",
                subtitle: "No fault observed today"
            ) { select(false) }

            optionButton(
                selected: hasFault == true,
                accentColor: theme.accent,
                icon: "exclamationmark.circle",
                title: "Not quite",
                subtitle: "A fault was observed"
            ) { select(true) }
        }
        .padding(.bottom, 20)
    }

    private func optionButton(selected: Bool, accentColor: Color, icon: String, title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    Circle().stroke(selected ? accentColor : theme.border, lineWidth: 2).frame(width: 24, height: 24)
                    if selected {
                        Circle().fill(accentColor).frame(width: 24, height: 24)
                        Image(systemName: icon).font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: FontSize.label, weight: .semibold)).foregroundStyle(selected ? accentColor : theme.text)
                    Text(subtitle).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary)
                }
                Spacer()
            }
            .padding(.vertical, 16).padding(.horizontal, 20)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(selected && accentColor == theme.success ? theme.success.opacity(0.08) : Color.clear)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(selected ? accentColor : theme.border, lineWidth: 1.5))
            )
        }
        .buttonStyle(PressableStyle())
    }

    private var noteSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Reflection note (optional)").font(.system(size: FontSize.caption, weight: .medium)).foregroundStyle(theme.textSecondary)
            TextField("What happened? How can you improve?", text: $note, axis: .vertical)
                .focused($noteFocused)
                .lineLimit(3...6)
                .font(.system(size: FontSize.body))
                .foregroundStyle(theme.text)
                .padding(14)
                .background(RoundedRectangle(cornerRadius: 8).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 8).stroke(theme.border, lineWidth: 1)))
                .onChange(of: note) { _, newValue in
                    if newValue.count > 140 { note = String(newValue.prefix(140)) }
                }
                .toolbar {
                    ToolbarItemGroup(placement: .keyboard) {
                        Spacer()
                        Button("Done") { noteFocused = false }
                    }
                }
            Text("\(note.count)/140").font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary).frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.bottom, 20)
    }

    private var footer: some View {
        VStack {
            PrimaryButton(
                title: isEditing ? "Update Observation" : "Save Observation",
                theme: theme,
                enabled: hasFault != nil && !showToast
            ) { save() }
        }
        .padding(.horizontal, 24).padding(.top, 20).padding(.bottom, 12)
    }

    private var toast: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle().fill(theme.success).frame(width: 56, height: 56)
                Image(systemName: "checkmark").font(.system(size: 24, weight: .bold)).foregroundStyle(.white)
            }
            Text(hasFault == true ? "Reflection saved" : "Well done today")
                .font(.system(size: FontSize.large, weight: .bold)).foregroundStyle(theme.text)
        }
        .padding(.vertical, 32).padding(.horizontal, 24)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.success, lineWidth: 1)))
        .padding(.horizontal, 24)
        .shadow(color: .black.opacity(0.15), radius: 24, y: 8)
        .transition(.scale.combined(with: .opacity))
    }

    private func select(_ value: Bool) {
        Haptics.light()
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) { hasFault = value }
    }

    private func save() {
        guard let hasFault else { return }
        noteFocused = false
        store.logObservation(date: today, hasFault: hasFault, note: note.isEmpty ? nil : note)
        Haptics.success()
        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) { showToast = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { dismiss() }
    }
}
