import { useEthica } from '@/contexts/EthicaContext';
import { VIRTUES } from '@/constants/virtues';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, KeyboardAvoidingView, Platform, Animated, ScrollView, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, CircleAlert } from 'lucide-react-native';
import colors from '@/constants/colors';
import { typography, sizes } from '@/constants/typography';
import * as Haptics from 'expo-haptics';
import { requestStoreReview, shouldTriggerReview } from '@/utils/storeReview';



export default function LogObservation() {
  const { state, logObservation, getCurrentWeekObservations } = useEthica();
  const today = new Date().toISOString().split('T')[0];
  const observations = getCurrentWeekObservations();
  const existingObs = observations.find(o => o.date === today);
  
  const [hasFault, setHasFault] = useState<boolean | null>(existingObs?.hasFault ?? null);
  const [note, setNote] = useState<string>(existingObs?.note || '');
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = state.followSystemTheme ? systemColorScheme === 'dark' : state.darkMode;
  const theme = isDark ? colors.dark : colors.light;

  const currentVirtue = VIRTUES.find(v => v.id === state.currentVirtueId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const optionScaleNo = useRef(new Animated.Value(1)).current;
  const optionScaleYes = useRef(new Animated.Value(1)).current;
  const noteAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (hasFault === true) {
      Animated.timing(noteAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      noteAnim.setValue(0);
    }
  }, [hasFault, noteAnim]);

  const animateOptionPress = (scale: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleOptionSelect = (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    animateOptionPress(value ? optionScaleYes : optionScaleNo);
    setHasFault(value);
  };

  const showSuccessToast = () => {
    setShowToast(true);
    Animated.parallel([
      Animated.spring(toastAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(checkScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSave = async () => {
    if (hasFault !== null) {
      logObservation(today, hasFault, note || undefined);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      showSuccessToast();
      
      if (!hasFault && state.streakData.currentStreak > 0) {
        const newStreak = state.streakData.currentStreak + 1;
        const shouldRequest = await shouldTriggerReview({
          type: 'streak_milestone',
          streakDays: newStreak,
        });
        
        if (shouldRequest) {
          setTimeout(() => {
            requestStoreReview();
          }, 1500);
        }
      }
      
      setTimeout(() => {
        try {
          router.back();
        } catch {
          router.replace('/home');
        }
      }, 1200);
    }
  };

  const isEditing = existingObs !== undefined;



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
          <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Observation
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              try {
                router.back();
              } catch {
                router.replace('/home');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Close"
            accessibilityRole="button"
            testID="close-button"
          >
            <X size={24} color={theme.text} strokeWidth={1.5} />
          </TouchableOpacity>
          </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, keyboardVisible && styles.scrollContentWithKeyboard]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.dateContext}>
            <Text style={[styles.dateText, { color: theme.textTertiary }]}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          {currentVirtue && (
            <View style={[styles.virtueCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
              <Text style={[styles.virtueName, { color: theme.text }]}>
                {currentVirtue.name}
              </Text>
              <View style={[styles.virtueDivider, { backgroundColor: theme.border }]} />
              <Text style={[styles.virtueDescription, { color: theme.textSecondary }]}>
                &ldquo;{currentVirtue.description}&rdquo;
              </Text>
            </View>
          )}

          <View style={styles.questionSection}>
            <Text style={[styles.questionLabel, { color: theme.textTertiary }]}>
              Today&apos;s Reflection
            </Text>
            <Text style={[styles.question, { color: theme.text }]}>
              Did you uphold this virtue?
            </Text>
          </View>

          <View style={styles.optionsSection}>
            <Animated.View style={{ transform: [{ scale: optionScaleNo }] }}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    borderColor: hasFault === false ? theme.success : theme.border,
                    backgroundColor: hasFault === false ? (isDark ? 'rgba(107, 155, 124, 0.15)' : 'rgba(74, 124, 89, 0.08)') : 'transparent',
                  },
                ]}
                onPress={() => handleOptionSelect(false)}
                activeOpacity={0.8}
                accessibilityLabel="Yes, I upheld this virtue"
                accessibilityRole="radio"
                accessibilityState={{ selected: hasFault === false }}
                testID="no-fault-option"
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionIndicator,
                    {
                      borderColor: hasFault === false ? theme.success : theme.border,
                      backgroundColor: hasFault === false ? theme.success : 'transparent',
                    },
                  ]}>
                    {hasFault === false && <Check size={14} color="#fff" strokeWidth={3} />}
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: hasFault === false ? theme.success : theme.text }]}>
                      Yes, I did
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.textTertiary }]}>
                      No fault observed today
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: optionScaleYes }] }}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    borderColor: hasFault === true ? theme.accent : theme.border,
                    backgroundColor: hasFault === true ? theme.surface : 'transparent',
                  },
                ]}
                onPress={() => handleOptionSelect(true)}
                activeOpacity={0.8}
                accessibilityLabel="No, I had a fault"
                accessibilityRole="radio"
                accessibilityState={{ selected: hasFault === true }}
                testID="fault-option"
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionIndicator,
                    {
                      borderColor: hasFault === true ? theme.accent : theme.border,
                      backgroundColor: hasFault === true ? theme.accent : 'transparent',
                    },
                  ]}>
                    {hasFault === true && <CircleAlert size={14} color={isDark ? '#1A1A1A' : '#fff'} strokeWidth={3} />}
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: hasFault === true ? theme.accent : theme.text }]}>
                      Not quite
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.textTertiary }]}>
                      A fault was observed
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {hasFault === true && (
            <Animated.View 
              style={[
                styles.noteSection,
                {
                  opacity: noteAnim,
                  transform: [{
                    translateY: noteAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  }],
                },
              ]}
            >
              <Text style={[styles.noteLabel, { color: theme.textSecondary }]}>
                Reflection note (optional)
              </Text>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
                value={note}
                onChangeText={setNote}
                placeholder="What happened? How can you improve?"
                placeholderTextColor={theme.textTertiary}
                maxLength={140}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
                accessibilityLabel="Reflection note"
                accessibilityHint="Enter a brief observation, maximum 140 characters"
                testID="note-input"
              />
              <TouchableOpacity
                style={[styles.dismissKeyboardButton, { borderColor: theme.border }]}
                onPress={Keyboard.dismiss}
                activeOpacity={0.7}
                accessibilityLabel="Done editing"
                accessibilityRole="button"
              >
                <Text style={[styles.dismissKeyboardText, { color: theme.textSecondary }]}>Done</Text>
              </TouchableOpacity>
              <Text style={[styles.characterCount, { color: theme.textTertiary }]}>
                {note.length}/140
              </Text>
            </Animated.View>
          )}

        </Animated.View>

          <View style={styles.scrollSpacer} />
        </ScrollView>

        <View style={[
          styles.footer, 
          { 
            backgroundColor: theme.background,
            paddingBottom: keyboardVisible ? 16 : 12,
          }
        ]}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: hasFault === null ? theme.disabled : theme.text,
                opacity: hasFault === null ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={hasFault === null || showToast}
            activeOpacity={0.8}
            accessibilityLabel={isEditing ? 'Update observation' : 'Save observation'}
            accessibilityRole="button"
            accessibilityState={{ disabled: hasFault === null }}
            testID="save-button"
          >
            <Text style={[styles.saveButtonText, { color: isDark ? theme.background : theme.background }]}>
              {isEditing ? 'Update Observation' : 'Save Observation'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showToast && (
        <Animated.View 
          style={[
            styles.toastContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.success,
              opacity: toastAnim,
              transform: [{
                scale: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }],
            },
          ]}
        >
          <Animated.View 
            style={[
              styles.toastCheckCircle,
              { 
                backgroundColor: theme.success,
                transform: [{ scale: checkScaleAnim }],
              },
            ]}
          >
            <Check size={24} color="#fff" strokeWidth={3} />
          </Animated.View>
          <Text style={[styles.toastText, { color: theme.text }]}>
            {hasFault ? 'Reflection saved' : 'Great job today!'}
          </Text>
        </Animated.View>
      )}
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
  headerLeft: {
    width: 24,
  },
  headerTitle: {
    ...typography.serif.semibold,
    fontSize: sizes.title,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentWithKeyboard: {
    paddingBottom: 20,
  },
  scrollSpacer: {
    height: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  dateContext: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  virtueCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 28,
  },
  virtueName: {
    ...typography.serif.semibold,
    fontSize: sizes.xlarge,
    marginBottom: 12,
  },
  virtueDivider: {
    width: 40,
    height: 1,
    marginBottom: 12,
  },
  virtueDescription: {
    ...typography.serif.regular,
    fontSize: sizes.body,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  questionSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  questionLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  question: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
    textAlign: 'center',
  },
  optionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
    marginBottom: 2,
  },
  optionSubtitle: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
  },
  noteSection: {
    marginBottom: 20,
  },
  noteLabel: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
    marginBottom: 10,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...typography.sans.regular,
    fontSize: sizes.body,
    minHeight: 90,
  },
  characterCount: {
    ...typography.sans.regular,
    fontSize: sizes.caption,
    textAlign: 'right',
    marginTop: 6,
  },
  dismissKeyboardButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  dismissKeyboardText: {
    ...typography.sans.medium,
    fontSize: sizes.caption,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.sans.semibold,
    fontSize: sizes.label,
  },
  toastContainer: {
    position: 'absolute',
    top: '40%',
    left: 24,
    right: 24,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  toastCheckCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toastText: {
    ...typography.serif.semibold,
    fontSize: sizes.large,
  },
});
