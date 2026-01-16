import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const scheduleEveningReflection = async (timeString: string, virtueName?: string): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hours, minutes] = timeString.split(':').map(Number);

  const title = 'Evening Reflection';
  const body = virtueName 
    ? `How was ${virtueName} today?`
    : 'A moment to observe the day.';

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'reflection' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });
};

export const scheduleWeeklySummary = async (
  weekStartDate: string,
  virtueName: string,
  faultCount: number,
  observationCount: number
): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  const startDate = new Date(weekStartDate);
  const endOfWeek = new Date(startDate);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(20, 0, 0, 0);

  if (endOfWeek <= new Date()) {
    return;
  }

  let summaryMessage = '';
  if (observationCount === 7 && faultCount === 0) {
    summaryMessage = `Perfect week practicing ${virtueName}! 🎉`;
  } else if (faultCount <= 2) {
    summaryMessage = `Great progress with ${virtueName} this week.`;
  } else {
    summaryMessage = `Week of ${virtueName} complete. Review your progress.`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly Summary',
      body: summaryMessage,
      data: { type: 'weekly_summary' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: endOfWeek,
    },
  });
};

export const sendImmediateWeeklySummary = async (
  virtueName: string,
  faultCount: number,
  totalDays: number,
  streakDays: number
): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  let title = 'Week Complete';
  let body = '';

  if (totalDays === 7 && faultCount === 0) {
    title = 'Perfect Week! 🌟';
    body = `Flawless practice of ${virtueName}. ${streakDays > 1 ? `${streakDays} day streak!` : ''}`;
  } else if (faultCount <= 2) {
    body = `${virtueName}: ${7 - faultCount}/7 days without fault. ${streakDays > 1 ? `Streak: ${streakDays} days` : ''}`;
  } else {
    body = `${virtueName} week done. ${faultCount} faults observed. Keep growing.`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'weekly_complete' },
    },
    trigger: null,
  });
};

export const cancelAllNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }
  
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const scheduleWeekEndReminder = async (
  weekStartDate: string,
  virtueName: string
): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  const startDate = new Date(weekStartDate);
  const endOfWeek = new Date(startDate);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(10, 0, 0, 0);

  if (endOfWeek <= new Date()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Week Complete',
      body: `Your week of ${virtueName} is ready for review. Time to reflect and choose your next virtue.`,
      data: { type: 'week_end_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: endOfWeek,
    },
  });
};

export const scheduleWinBackNotification = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 3);
  triggerDate.setHours(18, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'We miss you! 💫',
      body: 'Your character development journey awaits. Come back and it\'s even more worth it with our special offer!',
      data: { type: 'win_back', action: 'open_paywall' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  console.log('Win-back notification scheduled for:', triggerDate);
};

export const cancelWinBackNotification = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const winBackNotifications = scheduledNotifications.filter(
    notif => notif.content.data?.type === 'win_back'
  );

  for (const notif of winBackNotifications) {
    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
  }
};
