import { useEthica, JournalEntry } from '@/contexts/EthicaContext';
import { useRouter } from 'expo-router';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Feather,
  Heart,
  Sparkles,
  Mountain,
  Cloud,
  MoreHorizontal,
  Trash2,
  Edit3,
  Check,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import * as Haptics from 'expo-haptics';

type MoodType = JournalEntry['mood'];

const MOODS: { id: MoodType; label: string; icon: typeof Heart }[] = [
  { id: 'reflective', label: 'Reflective', icon: Feather },
  { id: 'grateful', label: 'Grateful', icon: Heart },
  { id: 'inspired', label: 'Inspired', icon: Sparkles },
  { id: 'challenged', label: 'Challenged', icon: Mountain },
  { id: 'peaceful', label: 'Peaceful', icon: Cloud },
];

export default function PersonalJournal() {
  const { state, addJournalEntry, updateJournalEntry, deleteJournalEntry, getJournalEntries } = useEthica();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [isComposing, setIsComposing] = useState(false);
  const [entryText, setEntryText] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const entries = getJournalEntries();

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      entry =>
        entry.content.toLowerCase().includes(query) ||
        entry.mood?.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: JournalEntry[] } = {};
    filteredEntries.forEach(entry => {
      const date = new Date(entry.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else if (date.getFullYear() === today.getFullYear()) {
        key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      } else {
        key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const openComposer = useCallback(() => {
    setIsComposing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const closeComposer = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsComposing(false);
      setEntryText('');
      setSelectedMood(undefined);
      setEditingEntry(null);
    });
  }, [fadeAnim, slideAnim]);

  const handleSave = useCallback(() => {
    if (!entryText.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingEntry) {
      updateJournalEntry(editingEntry.id, {
        content: entryText.trim(),
        mood: selectedMood,
      });
    } else {
      addJournalEntry(entryText.trim(), selectedMood);
    }

    closeComposer();
  }, [entryText, selectedMood, editingEntry, addJournalEntry, updateJournalEntry, closeComposer]);

  const handleEdit = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setEntryText(entry.content);
    setSelectedMood(entry.mood);
    setMenuOpenId(null);
    openComposer();
  }, [openComposer]);

  const handleDelete = useCallback((entry: JournalEntry) => {
    setMenuOpenId(null);
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteJournalEntry(entry.id);
          },
        },
      ]
    );
  }, [deleteJournalEntry]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getMoodIcon = (mood: MoodType) => {
    const moodData = MOODS.find(m => m.id === mood);
    return moodData?.icon || Feather;
  };

  const getMoodColor = (mood: MoodType) => {
    switch (mood) {
      case 'grateful': return '#E8834A';
      case 'inspired': return '#9B8AC4';
      case 'challenged': return '#6B8E7A';
      case 'peaceful': return '#7BA3C9';
      case 'reflective': return theme.accent;
      default: return theme.textTertiary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
            activeOpacity={0.7}
            testID="journal-back-button"
          >
            <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Journal</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setIsSearching(!isSearching)}
            activeOpacity={0.7}
            testID="search-toggle-button"
          >
            {isSearching ? (
              <X size={22} color={theme.accent} strokeWidth={1.5} />
            ) : (
              <Search size={22} color={theme.textTertiary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        </View>

        {isSearching && (
          <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search size={18} color={theme.textTertiary} strokeWidth={1.5} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search your thoughts..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              testID="search-input"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <X size={18} color={theme.textTertiary} strokeWidth={1.5} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {Object.keys(groupedEntries).length > 0 ? (
            Object.entries(groupedEntries).map(([dateLabel, dateEntries]) => (
              <View key={dateLabel} style={styles.dateGroup}>
                <Text style={[styles.dateLabel, { color: theme.textTertiary }]}>{dateLabel}</Text>
                {dateEntries.map(entry => {
                  const MoodIcon = getMoodIcon(entry.mood);
                  const moodColor = getMoodColor(entry.mood);

                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.entryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      onPress={() => handleEdit(entry)}
                      activeOpacity={0.8}
                      testID={`entry-${entry.id}`}
                    >
                      <View style={styles.entryHeader}>
                        <View style={styles.entryMeta}>
                          {entry.mood && (
                            <View style={[styles.moodBadge, { backgroundColor: `${moodColor}15` }]}>
                              <MoodIcon size={12} color={moodColor} strokeWidth={2} />
                              <Text style={[styles.moodBadgeText, { color: moodColor }]}>
                                {entry.mood}
                              </Text>
                            </View>
                          )}
                          <Text style={[styles.entryTime, { color: theme.textTertiary }]}>
                            {formatTime(entry.createdAt)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.menuButton}
                          onPress={() => setMenuOpenId(menuOpenId === entry.id ? null : entry.id)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MoreHorizontal size={18} color={theme.textTertiary} strokeWidth={1.5} />
                        </TouchableOpacity>
                      </View>

                      {menuOpenId === entry.id && (
                        <View style={[styles.menuDropdown, { backgroundColor: theme.background, borderColor: theme.border }]}>
                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleEdit(entry)}
                            activeOpacity={0.7}
                          >
                            <Edit3 size={16} color={theme.text} strokeWidth={1.5} />
                            <Text style={[styles.menuItemText, { color: theme.text }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleDelete(entry)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color="#D64545" strokeWidth={1.5} />
                            <Text style={[styles.menuItemText, { color: '#D64545' }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <Text
                        style={[styles.entryContent, { color: theme.text }]}
                        numberOfLines={6}
                      >
                        {entry.content}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.surface }]}>
                <Feather size={40} color={theme.textTertiary} strokeWidth={1.2} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Your journal awaits
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Capture your thoughts, reflections, and ideas. Every entry becomes part of your personal story.
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { borderColor: theme.border }]}
                onPress={openComposer}
                activeOpacity={0.7}
              >
                <Plus size={18} color={theme.text} strokeWidth={2} />
                <Text style={[styles.emptyButtonText, { color: theme.text }]}>Write First Entry</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {!isComposing && entries.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.text, bottom: Math.max(24, insets.bottom + 16) }]}
            onPress={openComposer}
            activeOpacity={0.85}
            testID="new-entry-fab"
          >
            <Plus size={24} color={theme.background} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {isComposing && (
          <Animated.View
            style={[
              styles.composerOverlay,
              {
                backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity style={styles.overlayTouchable} onPress={closeComposer} activeOpacity={1} />
          </Animated.View>
        )}

        {isComposing && (
          <Animated.View
            style={[
              styles.composer,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                transform: [{ translateY: slideAnim }],
                bottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom,
              },
            ]}
          >
            <View style={styles.composerHeader}>
              <TouchableOpacity onPress={closeComposer} activeOpacity={0.7}>
                <X size={24} color={theme.textTertiary} strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={[styles.composerTitle, { color: theme.text }]}>
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </Text>
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.7}
                disabled={!entryText.trim()}
                style={[
                  styles.saveButton,
                  { backgroundColor: entryText.trim() ? theme.text : theme.disabled },
                ]}
              >
                <Check size={18} color={theme.background} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodSelector}
              style={styles.moodScrollView}
            >
              {MOODS.map(mood => {
                const MoodIcon = mood.icon;
                const isSelected = selectedMood === mood.id;
                const moodColor = getMoodColor(mood.id);

                return (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodChip,
                      {
                        backgroundColor: isSelected ? `${moodColor}20` : theme.surface,
                        borderColor: isSelected ? moodColor : theme.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMood(isSelected ? undefined : mood.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <MoodIcon size={14} color={isSelected ? moodColor : theme.textSecondary} strokeWidth={2} />
                    <Text
                      style={[
                        styles.moodChipText,
                        { color: isSelected ? moodColor : theme.textSecondary },
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={[styles.composerInput, { color: theme.text }]}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.textTertiary}
              value={entryText}
              onChangeText={setEntryText}
              multiline
              autoFocus
              textAlignVertical="top"
              testID="composer-input"
            />
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  headerSubtitle: {
    ...typography.sans.regular,
    fontSize: 11,
    marginTop: 2,
  },
  searchButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...typography.sans.regular,
    fontSize: sizes.body,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingLeft: 4,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  moodBadgeText: {
    ...typography.sans.medium,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  entryTime: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  menuButton: {
    padding: 4,
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    right: 12,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  menuItemText: {
    ...typography.sans.medium,
    fontSize: sizes.body,
  },
  entryContent: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  composerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  overlayTouchable: {
    flex: 1,
  },
  composer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 100,
    maxHeight: '70%',
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  composerTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodScrollView: {
    marginBottom: 16,
    marginHorizontal: -24,
  },
  moodSelector: {
    paddingHorizontal: 24,
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    gap: 6,
  },
  moodChipText: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
  },
  composerInput: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 26,
    minHeight: 120,
    maxHeight: 200,
  },
});
