import { useEthica } from '@/contexts/EthicaContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Alert, Platform, KeyboardAvoidingView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Calendar, Sun, Moon, Download, ListOrdered, RotateCcw, BookOpen, Shield, Info, Sparkles, Edit3 } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import { exportCharacterRecord } from '@/utils/exportData';
import React, { useState, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';

interface ToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
  theme: typeof colors.light;
}

function ToggleSwitch({ value, onToggle, disabled, theme }: ToggleSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? 20 : 0)).current;

  const handleToggle = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(translateX, {
      toValue: value ? 0 : 20,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
    onToggle();
  }, [value, disabled, onToggle, translateX]);

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.switch,
        {
          backgroundColor: value ? theme.success : theme.borderLight,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.switchThumb,
          {
            backgroundColor: '#FFFFFF',
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  isDestructive?: boolean;
  isLast?: boolean;
  theme: typeof colors.light;
  disabled?: boolean;
  isLoading?: boolean;
}

function SettingRow({ 
  icon, 
  label, 
  sublabel, 
  onPress, 
  rightElement, 
  showChevron, 
  isDestructive, 
  isLast, 
  theme,
  disabled,
  isLoading,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.settingRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderLight },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress || disabled || isLoading}
    >
      <View style={[styles.settingIconContainer, { backgroundColor: isDestructive ? 'rgba(220, 53, 69, 0.1)' : theme.backgroundSecondary }]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[
          styles.settingLabel, 
          { color: isDestructive ? '#DC3545' : theme.text },
          disabled && { opacity: 0.5 },
        ]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.settingSubLabel, { color: theme.textTertiary }]}>
            {sublabel}
          </Text>
        )}
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.textTertiary} />
      ) : (
        rightElement || (showChevron && <ChevronRight size={18} color={theme.textTertiary} strokeWidth={2} />)
      )}
    </TouchableOpacity>
  );
}

export default function Settings() {
  const { state, updateState, resetData } = useEthica();
  const { isPro } = useRevenueCat();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const [isExporting, setIsExporting] = useState(false);

  const handleWeekStartToggle = () => {
    updateState({ weekStartsMonday: !state.weekStartsMonday });
  };

  const handleThemeToggle = () => {
    updateState({ followSystemTheme: !state.followSystemTheme });
  };

  const handleDarkModeToggle = () => {
    if (!state.followSystemTheme) {
      updateState({ darkMode: !state.darkMode });
    }
  };


  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCharacterRecord(state);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Export failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (Platform.OS === 'web') {
        alert('Export failed. Please try again.');
      } else {
        Alert.alert('Export Failed', 'Unable to export data. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      const confirmed = confirm('Delete your account?\n\nThis will permanently delete:\n• All virtue tracking data\n• Weekly observations and notes\n• Custom virtues\n• App settings\n\nThis action cannot be undone. Your subscription (if any) will remain active until canceled separately.');
      if (confirmed) {
        resetData();
        router.replace('/');
      }
    } else {
      Alert.alert(
        'Delete Account',
        'This will permanently delete:\n\n• All virtue tracking data\n• Weekly observations and notes\n• Custom virtues\n• App settings\n\nThis action cannot be undone. Your subscription (if any) will remain active until canceled separately.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Account',
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              resetData();
              router.replace('/');
            },
          },
        ]
      );
    }
  };

  const handleResetData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      const confirmed = confirm('Are you sure you want to reset all character history? This action cannot be undone.');
      if (confirmed) {
        resetData();
        router.replace('/');
      }
    } else {
      Alert.alert(
        'Reset Character History',
        'Are you sure you want to reset all character history? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              resetData();
              router.replace('/');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
      <View style={[styles.header, { backgroundColor: theme.backgroundSecondary }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            try {
              router.back();
            } catch {
              router.replace('/home');
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID="settings-back-button"
        >
          <ArrowLeft size={20} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Settings
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            PREFERENCES
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon={<Calendar size={18} color={theme.accent} strokeWidth={2} />}
              label="Week starts on Monday"
              theme={theme}
              isLast
              rightElement={
                <ToggleSwitch
                  value={state.weekStartsMonday}
                  onToggle={handleWeekStartToggle}
                  theme={theme}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            APPEARANCE
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon={<Sun size={18} color={theme.accent} strokeWidth={2} />}
              label="Follow system"
              theme={theme}
              rightElement={
                <ToggleSwitch
                  value={state.followSystemTheme}
                  onToggle={handleThemeToggle}
                  theme={theme}
                />
              }
            />
            <SettingRow
              icon={<Moon size={18} color={state.followSystemTheme ? theme.disabled : theme.accent} strokeWidth={2} />}
              label="Dark mode"
              theme={theme}
              isLast
              disabled={state.followSystemTheme}
              rightElement={
                <ToggleSwitch
                  value={state.darkMode && !state.followSystemTheme}
                  onToggle={handleDarkModeToggle}
                  disabled={state.followSystemTheme}
                  theme={theme}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            DATA & PLANNING
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon={<Edit3 size={18} color={theme.accent} strokeWidth={2} />}
              label="Custom virtues"
              sublabel={isPro ? "Manage your custom virtues" : "Create your own principles"}
              onPress={() => router.push('/custom-virtues')}
              showChevron
              theme={theme}
            />
            <SettingRow
              icon={<Download size={18} color={theme.accent} strokeWidth={2} />}
              label="Export character record"
              sublabel="Download your progress data"
              onPress={handleExport}
              showChevron
              theme={theme}
              isLoading={isExporting}
            />
            <SettingRow
              icon={<ListOrdered size={18} color={theme.accent} strokeWidth={2} />}
              label="Virtue queue"
              sublabel="Plan your upcoming cycle"
              onPress={() => router.push('/virtue-queue')}
              showChevron
              theme={theme}
              isLast
            />
          </View>
        </View>

        {!isPro && (
          <View style={styles.section}>
            <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={styles.upgradeCard}
                onPress={() => router.push('/paywall')}
                activeOpacity={0.7}
              >
                <View style={[styles.upgradeIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Sparkles size={24} color={theme.accent} strokeWidth={1.5} />
                </View>
                <View style={styles.upgradeContent}>
                  <Text style={[styles.upgradeTitle, { color: theme.text }]}>
                    Upgrade to Ethica Pro
                  </Text>
                  <Text style={[styles.upgradeSubtitle, { color: theme.textSecondary }]}>
                    Unlock custom virtues, advanced analytics, and more
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isPro && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
              SUBSCRIPTION
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
              <SettingRow
                icon={<Sparkles size={18} color={theme.accent} strokeWidth={2} />}
                label="Ethica Pro"
                sublabel="Manage your subscription"
                onPress={() => router.push('/paywall')}
                showChevron
                theme={theme}
                isLast
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            ABOUT
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon={<BookOpen size={18} color={theme.accent} strokeWidth={2} />}
              label="Franklin's method"
              sublabel="Learn about the philosophy"
              onPress={() => router.push('/franklin-method')}
              showChevron
              theme={theme}
            />
            <SettingRow
              icon={<Shield size={18} color={theme.accent} strokeWidth={2} />}
              label="Privacy & Terms"
              onPress={() => router.push('/policies')}
              showChevron
              theme={theme}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            DANGER ZONE
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <SettingRow
              icon={<RotateCcw size={18} color="#DC3545" strokeWidth={2} />}
              label="Delete account"
              sublabel="Permanently delete all your data"
              onPress={handleDeleteAccount}
              isDestructive
              showChevron
              theme={theme}
            />
            <SettingRow
              icon={<RotateCcw size={18} color="#DC3545" strokeWidth={2} />}
              label="Reset all data"
              sublabel="This cannot be undone"
              onPress={handleResetData}
              isDestructive
              showChevron
              theme={theme}
              isLast
            />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.footerCard, { backgroundColor: theme.surface }]}>
            <Info size={16} color={theme.textTertiary} strokeWidth={2} />
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Based on Benjamin Franklin&apos;s method of character formation through disciplined daily observation.
            </Text>
          </View>
          <Text style={[styles.versionText, { color: theme.textTertiary }]}>
            Ethica · Version 1.0.0
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    ...typography.sans.medium,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 8,
  },
  settingLabel: {
    ...typography.sans.medium,
    fontSize: 15,
  },
  settingSubLabel: {
    ...typography.sans.regular,
    fontSize: 12,
    marginTop: 2,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  timeInput: {
    ...typography.sans.medium,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    textAlign: 'center',
  },
  timeDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    ...typography.sans.medium,
    fontSize: 14,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  footerText: {
    ...typography.sans.regular,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  versionText: {
    ...typography.sans.regular,
    fontSize: 12,
    marginTop: 8,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  upgradeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeContent: {
    flex: 1,
    gap: 4,
  },
  upgradeTitle: {
    ...typography.sans.semibold,
    fontSize: 16,
  },
  upgradeSubtitle: {
    ...typography.sans.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
