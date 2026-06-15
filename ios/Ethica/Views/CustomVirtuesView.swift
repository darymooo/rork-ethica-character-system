//
//  CustomVirtuesView.swift
//  Ethica
//

import SwiftUI

struct CustomVirtuesView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(PurchaseStore.self) private var purchases
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme
    @FocusState private var focused: Field?

    private enum Field { case name, description, context }

    @State private var isAdding = false
    @State private var name = ""
    @State private var descriptionText = ""
    @State private var context = ""
    @State private var alert: SimpleAlert?
    @State private var pendingDelete: CustomVirtue?

    private var isPro: Bool { purchases.isPro }
    private var customVirtues: [CustomVirtue] { store.customVirtues }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Custom Virtues", theme: theme, trailing: AnyView(
                    Button { isAdding = true } label: {
                        Image(systemName: "plus").font(.system(size: 22)).foregroundStyle(theme.text)
                    }
                )) { router.pop() }

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        if !isPro { proCard }
                        if isAdding { addForm }
                        if customVirtues.isEmpty && !isAdding { emptyState }
                        ForEach(customVirtues) { virtue in virtueCard(virtue) }
                    }
                    .padding(.horizontal, 32)
                    .padding(.bottom, 32)
                    .frame(maxWidth: 760)
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .alert(item: $alert) { Alert(title: Text($0.title), message: Text($0.message), dismissButton: .default(Text("OK"))) }
        .alert("Delete Virtue", isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } })) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                if let v = pendingDelete { store.deleteCustomVirtue(id: v.id) }
                pendingDelete = nil
            }
        } message: {
            Text("Are you sure you want to delete \"\(pendingDelete?.name ?? "")\"? This action cannot be undone.")
        }
    }

    private var proCard: some View {
        Button { router.presentPaywall(.generic) } label: {
            HStack(spacing: 12) {
                ZStack { Circle().fill(theme.accent.opacity(0.12)).frame(width: 40, height: 40); Image(systemName: "sparkles").foregroundStyle(theme.accent) }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Upgrade to Pro").font(.system(size: FontSize.label, weight: .semibold)).foregroundStyle(theme.text)
                    Text("Create unlimited custom virtues to track your personal principles").font(.system(size: FontSize.caption)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.leading)
                }
                Spacer()
                Image(systemName: "lock").foregroundStyle(theme.textTertiary)
            }
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.accent, lineWidth: 2)))
        }
        .buttonStyle(PressableStyle())
    }

    private var addForm: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("New Custom Virtue").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
            field(label: "Name *", text: $name, placeholder: "e.g., Patience, Courage, Gratitude", field: .name)
            field(label: "Description *", text: $descriptionText, placeholder: "Short description of the virtue", field: .description, multiline: true)
            field(label: "Context (Optional)", text: $context, placeholder: "Why this virtue matters to you", field: .context, multiline: true)
            HStack(spacing: 12) {
                Button {
                    isAdding = false; name = ""; descriptionText = ""; context = ""
                } label: {
                    Text("Cancel").font(.system(size: FontSize.label, weight: .semibold)).foregroundStyle(theme.text)
                        .frame(maxWidth: .infinity).padding(.vertical, 12)
                        .background(RoundedRectangle(cornerRadius: 8).stroke(theme.border, lineWidth: 1))
                }.buttonStyle(PressableStyle())
                Button { handleAdd() } label: {
                    Text("Save").font(.system(size: FontSize.label, weight: .semibold)).foregroundStyle(.white)
                        .frame(maxWidth: .infinity).padding(.vertical, 12)
                        .background(RoundedRectangle(cornerRadius: 8).fill(theme.accent))
                }.buttonStyle(PressableStyle())
            }
        }
        .padding(20)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.border, lineWidth: 1)))
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("Done") { focused = nil } }
        }
    }

    private func field(label: String, text: Binding<String>, placeholder: String, field: Field, multiline: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label.uppercased()).font(.system(size: FontSize.caption, weight: .medium)).tracking(0.5).foregroundStyle(theme.textSecondary)
            Group {
                if multiline {
                    TextField(placeholder, text: text, axis: .vertical).lineLimit(3...6)
                } else {
                    TextField(placeholder, text: text)
                }
            }
            .focused($focused, equals: field)
            .font(.system(size: FontSize.body))
            .foregroundStyle(theme.text)
            .padding(.horizontal, 16).padding(.vertical, 12)
            .background(RoundedRectangle(cornerRadius: 8).fill(theme.background).overlay(RoundedRectangle(cornerRadius: 8).stroke(theme.border, lineWidth: 1)))
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("No Custom Virtues Yet").font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text).multilineTextAlignment(.center)
            Text(isPro ? "Create your own virtues to track principles that matter to you." : "Upgrade to Pro to create custom virtues and track your personal principles.")
                .font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.center).lineSpacing(4)
        }
        .padding(.vertical, 60)
    }

    private func virtueCard(_ virtue: CustomVirtue) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(virtue.name).font(.system(size: FontSize.title, weight: .bold)).foregroundStyle(theme.text)
                Spacer()
                Button { pendingDelete = virtue } label: {
                    Image(systemName: "trash").font(.system(size: 18)).foregroundStyle(theme.textTertiary)
                }
            }
            Text(virtue.description).font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).lineSpacing(4)
            if !virtue.context.isEmpty {
                Text(virtue.context).font(.system(size: FontSize.caption)).italic().foregroundStyle(theme.textTertiary).lineSpacing(2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 12).fill(theme.surface).overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.border, lineWidth: 1)))
    }

    private func handleAdd() {
        guard isPro else {
            alert = SimpleAlert(title: "Premium Feature", message: "Custom virtues are available in Ethica Pro. Upgrade to create your own virtues.")
            router.presentPaywall(.generic)
            return
        }
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            alert = SimpleAlert(title: "Missing Name", message: "Please enter a name for your virtue."); return
        }
        guard !descriptionText.trimmingCharacters(in: .whitespaces).isEmpty else {
            alert = SimpleAlert(title: "Missing Description", message: "Please enter a description for your virtue."); return
        }
        store.addCustomVirtue(name: name.trimmingCharacters(in: .whitespaces), description: descriptionText.trimmingCharacters(in: .whitespaces), context: context.trimmingCharacters(in: .whitespaces))
        name = ""; descriptionText = ""; context = ""; isAdding = false
        Haptics.success()
        alert = SimpleAlert(title: "Virtue Created", message: "Your custom virtue has been added.")
    }
}

struct SimpleAlert: Identifiable {
    let id = UUID()
    let title: String
    let message: String
}
