//
//  VirtueQueueView.swift
//  Ethica
//

import SwiftUI

struct VirtueQueueView: View {
    @Environment(EthicaStore.self) private var store
    @Environment(AppRouter.self) private var router
    @Environment(\.theme) private var theme

    @State private var showAddMenu = false

    private var queuedVirtues: [Virtue] {
        store.state.virtueQueue.compactMap { Virtues.byId($0) }
    }
    private var availableVirtues: [Virtue] {
        Virtues.all.filter { !store.state.virtueQueue.contains($0.id) }
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                DetailHeader(title: "Virtue Queue", theme: theme) { router.pop() }
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        Text("Plan your upcoming cycle of virtues. The queue is optional—you may select spontaneously if you prefer.")
                            .font(.system(size: FontSize.body)).foregroundStyle(theme.textSecondary).multilineTextAlignment(.center).lineSpacing(6)
                            .padding(.vertical, 24)

                        if queuedVirtues.isEmpty {
                            Text("No virtues queued").font(.system(size: FontSize.body)).foregroundStyle(theme.textTertiary).padding(.vertical, 64)
                        } else {
                            VStack(spacing: 12) {
                                ForEach(Array(queuedVirtues.enumerated()), id: \.element.id) { index, virtue in
                                    queueItem(virtue, index: index)
                                }
                            }
                        }

                        if !availableVirtues.isEmpty { addSection }
                    }
                    .padding(.horizontal, 32)
                    .padding(.bottom, 32)
                    .frame(maxWidth: 760)
                    .frame(maxWidth: .infinity)
                }
            }
        }
    }

    private func queueItem(_ virtue: Virtue, index: Int) -> some View {
        HStack(spacing: 16) {
            Text("\(index + 1)").font(.system(size: FontSize.body, weight: .semibold)).foregroundStyle(theme.textTertiary).frame(width: 32, height: 32)
            VStack(alignment: .leading, spacing: 4) {
                Text(virtue.name).font(.system(size: FontSize.body, weight: .bold)).foregroundStyle(theme.text)
                Text(virtue.description).font(.system(size: FontSize.caption)).foregroundStyle(theme.textSecondary).lineLimit(1)
            }
            Spacer()
            VStack(spacing: 4) {
                Button { moveUp(index) } label: {
                    Text("↑").font(.system(size: 16, weight: .semibold)).foregroundStyle(theme.textSecondary)
                }.disabled(index == 0).opacity(index == 0 ? 0.3 : 1)
                Button { moveDown(index) } label: {
                    Text("↓").font(.system(size: 16, weight: .semibold)).foregroundStyle(theme.textSecondary)
                }.disabled(index == queuedVirtues.count - 1).opacity(index == queuedVirtues.count - 1 ? 0.3 : 1)
            }
            Button { store.removeFromQueue(virtue.id) } label: {
                Image(systemName: "xmark").font(.system(size: 16)).foregroundStyle(theme.textTertiary)
            }
        }
        .padding(16)
        .background(Rectangle().fill(theme.surface).overlay(Rectangle().stroke(theme.border, lineWidth: 1)))
    }

    private var addSection: some View {
        VStack(spacing: 16) {
            Button { withAnimation { showAddMenu.toggle() } } label: {
                HStack(spacing: 8) {
                    Image(systemName: "plus").font(.system(size: 18)).foregroundStyle(theme.text)
                    Text("Add virtue to queue").font(.system(size: FontSize.body, weight: .semibold)).foregroundStyle(theme.text)
                }
                .frame(maxWidth: .infinity).padding(.vertical, 16).padding(.horizontal, 24)
                .background(RoundedRectangle(cornerRadius: 12).stroke(theme.border, lineWidth: 1))
            }
            .buttonStyle(PressableStyle())

            if showAddMenu {
                VStack(spacing: 0) {
                    ForEach(availableVirtues) { virtue in
                        Button {
                            store.addToQueue(virtue.id); withAnimation { showAddMenu = false }
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(virtue.name).font(.system(size: FontSize.body, weight: .bold)).foregroundStyle(theme.text)
                                Text(virtue.description).font(.system(size: FontSize.caption)).foregroundStyle(theme.textTertiary).lineLimit(1)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 16).padding(.horizontal, 24)
                            .overlay(alignment: .bottom) { Rectangle().fill(theme.borderLight).frame(height: 1) }
                        }
                        .buttonStyle(PressableStyle())
                    }
                }
                .background(Rectangle().fill(theme.surface).overlay(Rectangle().stroke(theme.borderLight, lineWidth: 1)))
            }
        }
        .padding(.top, 32)
    }

    private func moveUp(_ index: Int) {
        guard index > 0 else { return }
        var queue = store.state.virtueQueue
        queue.swapAt(index - 1, index)
        store.reorderQueue(queue)
    }

    private func moveDown(_ index: Int) {
        guard index < store.state.virtueQueue.count - 1 else { return }
        var queue = store.state.virtueQueue
        queue.swapAt(index, index + 1)
        store.reorderQueue(queue)
    }
}
