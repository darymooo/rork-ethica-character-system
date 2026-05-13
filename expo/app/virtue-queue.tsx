import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X, Plus } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';

export default function VirtueQueue() {
  const { state, addToVirtueQueue, removeFromVirtueQueue, reorderVirtueQueue } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const [showAddMenu, setShowAddMenu] = useState(false);

  const queuedVirtues = state.virtueQueue
    .map(id => VIRTUES.find(v => v.id === id))
    .filter((v): v is import('@/constants/virtues').Virtue => v !== undefined);
  const availableVirtues = VIRTUES.filter(v => !state.virtueQueue.includes(v.id));

  const handleAddVirtue = (virtueId: string) => {
    addToVirtueQueue(virtueId);
    setShowAddMenu(false);
  };

  const handleRemoveVirtue = (virtueId: string) => {
    removeFromVirtueQueue(virtueId);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newQueue = [...state.virtueQueue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    reorderVirtueQueue(newQueue);
  };

  const moveDown = (index: number) => {
    if (index === state.virtueQueue.length - 1) return;
    const newQueue = [...state.virtueQueue];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    reorderVirtueQueue(newQueue);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            try {
              router.back();
            } catch {
              router.replace('/home');
            }
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Virtue Queue
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
            Plan your upcoming cycle of virtues. The queue is optional—you may select spontaneously if you prefer.
          </Text>
        </View>

        {queuedVirtues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
              No virtues queued
            </Text>
          </View>
        ) : (
          <View style={styles.queueList}>
            {queuedVirtues.map((virtue, index) => (
              <View
                key={virtue.id}
                style={[styles.queueItem, { borderColor: theme.border, backgroundColor: theme.surface }]}
              >
                <View style={styles.queueItemLeft}>
                  <View style={styles.orderIndicator}>
                    <Text style={[styles.orderNumber, { color: theme.textTertiary }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.virtueInfo}>
                    <Text style={[styles.virtueName, { color: theme.text }]}>
                      {virtue.name}
                    </Text>
                    <Text style={[styles.virtueDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                      {virtue.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.queueItemActions}>
                  <View style={styles.moveButtons}>
                    <TouchableOpacity
                      onPress={() => moveUp(index)}
                      disabled={index === 0}
                      style={[styles.moveButton, { opacity: index === 0 ? 0.3 : 1 }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.moveButtonText, { color: theme.textSecondary }]}>
                        ↑
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveDown(index)}
                      disabled={index === queuedVirtues.length - 1}
                      style={[styles.moveButton, { opacity: index === queuedVirtues.length - 1 ? 0.3 : 1 }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.moveButtonText, { color: theme.textSecondary }]}>
                        ↓
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => handleRemoveVirtue(virtue.id)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={theme.textTertiary} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {availableVirtues.length > 0 && (
          <View style={styles.addSection}>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: theme.border }]}
              onPress={() => setShowAddMenu(!showAddMenu)}
              activeOpacity={0.7}
            >
              <Plus size={20} color={theme.text} strokeWidth={1.5} />
              <Text style={[styles.addButtonText, { color: theme.text }]}>
                Add virtue to queue
              </Text>
            </TouchableOpacity>

            {showAddMenu && (
              <View style={[styles.addMenu, { borderColor: theme.borderLight, backgroundColor: theme.surface }]}>
                {availableVirtues.map(virtue => (
                  <TouchableOpacity
                    key={virtue.id}
                    style={[styles.addMenuItem, { borderBottomColor: theme.borderLight }]}
                    onPress={() => handleAddVirtue(virtue.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addMenuItemName, { color: theme.text }]}>
                      {virtue.name}
                    </Text>
                    <Text style={[styles.addMenuItemDesc, { color: theme.textTertiary }]} numberOfLines={1}>
                      {virtue.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  descriptionContainer: {
    paddingVertical: 24,
  },
  descriptionText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 24,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  queueList: {
    gap: 12,
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  queueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  orderIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumber: {
    ...typography.sans.semibold,
    fontSize: sizes.body,
  },
  virtueInfo: {
    flex: 1,
    gap: 4,
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: sizes.body,
  },
  virtueDescription: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  queueItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moveButtons: {
    flexDirection: 'column',
    gap: 4,
  },
  moveButton: {
    padding: 4,
  },
  moveButtonText: {
    ...typography.sans.semibold,
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  addSection: {
    marginTop: 32,
    gap: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.body,
  },
  addMenu: {
    borderWidth: 1,
    borderRadius: 0,
  },
  addMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 4,
  },
  addMenuItemName: {
    ...typography.serif.semibold,
    fontSize: sizes.body,
  },
  addMenuItemDesc: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
});
