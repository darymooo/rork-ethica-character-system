import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Sparkles, Lock } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { useEthica } from '@/contexts/EthicaContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';

export default function CustomVirtues() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const { state, addCustomVirtue, deleteCustomVirtue, getCustomVirtues } = useEthica();
  const { isPro } = useRevenueCat();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const customVirtues = getCustomVirtues();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');

  const handleAdd = () => {
    if (!isPro) {
      Alert.alert(
        'Premium Feature',
        'Custom virtues are available in Ethica Pro. Upgrade to create your own virtues.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall') }
        ]
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your virtue.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a description for your virtue.');
      return;
    }

    addCustomVirtue(name.trim(), description.trim(), context.trim());
    setName('');
    setDescription('');
    setContext('');
    setIsAdding(false);
    Alert.alert('Success', 'Your custom virtue has been created!');
  };

  const handleDelete = (id: string, virtueName: string) => {
    Alert.alert(
      'Delete Virtue',
      `Are you sure you want to delete "${virtueName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteCustomVirtue(id);
            Alert.alert('Deleted', 'The virtue has been removed.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="back-button"
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Custom Virtues
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAdding(true)}
          activeOpacity={0.7}
          testID="add-virtue-button"
        >
          <Plus size={24} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isPro && (
          <TouchableOpacity
            style={[styles.proCard, { backgroundColor: theme.surface, borderColor: theme.accent }]}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.7}
            testID="upgrade-banner"
          >
            <View style={[styles.proIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <Sparkles size={24} color={theme.accent} strokeWidth={1.5} />
            </View>
            <View style={styles.proContent}>
              <Text style={[styles.proTitle, { color: theme.text }]}>
                Upgrade to Pro
              </Text>
              <Text style={[styles.proSubtitle, { color: theme.textSecondary }]}>
                Create unlimited custom virtues to track your personal principles
              </Text>
            </View>
            <Lock size={20} color={theme.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
        )}

        {isAdding && (
          <View style={[styles.addForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              New Custom Virtue
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Name *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Patience, Courage, Gratitude"
                placeholderTextColor={theme.textTertiary}
                maxLength={50}
                testID="virtue-name-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Description *
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Short description of the virtue"
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={3}
                maxLength={200}
                testID="virtue-description-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Context (Optional)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={context}
                onChangeText={setContext}
                placeholder="Why this virtue matters to you"
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={500}
                testID="virtue-context-input"
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, { borderColor: theme.border }]}
                onPress={() => {
                  setIsAdding(false);
                  setName('');
                  setDescription('');
                  setContext('');
                }}
                activeOpacity={0.7}
                testID="cancel-button"
              >
                <Text style={[styles.formButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonPrimary, { backgroundColor: theme.accent }]}
                onPress={handleAdd}
                activeOpacity={0.7}
                testID="save-button"
              >
                <Text style={[styles.formButtonText, { color: '#FFFFFF' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {customVirtues.length === 0 && !isAdding && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Custom Virtues Yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {isPro 
                ? 'Create your own virtues to track principles that matter to you.'
                : 'Upgrade to Pro to create custom virtues and track your personal principles.'
              }
            </Text>
          </View>
        )}

        {customVirtues.map((virtue) => (
          <View
            key={virtue.id}
            style={[styles.virtueCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.virtueHeader}>
              <Text style={[styles.virtueName, { color: theme.text }]}>
                {virtue.name}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(virtue.id, virtue.name)}
                activeOpacity={0.7}
                testID={`delete-${virtue.id}`}
              >
                <Trash2 size={18} color={theme.textTertiary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.virtueDescription, { color: theme.textSecondary }]}>
              {virtue.description}
            </Text>
            {virtue.context && (
              <Text style={[styles.virtueContext, { color: theme.textTertiary }]}>
                {virtue.context}
              </Text>
            )}
          </View>
        ))}
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
  addButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 16,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  proIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proContent: {
    flex: 1,
    gap: 4,
  },
  proTitle: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  proSubtitle: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    lineHeight: 18,
  },
  addForm: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 20,
  },
  formTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    ...typography.sans.regular,
    fontSize: sizes.body,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  formButtonPrimary: {
    borderWidth: 0,
  },
  formButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  virtueCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  virtueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  virtueDescription: {
    ...typography.sans.regular,
    fontSize: sizes.body,
    lineHeight: 22,
  },
  virtueContext: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
});
