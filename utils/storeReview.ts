import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REVIEW_STORAGE_KEY = 'store_review_data';

interface ReviewData {
  lastRequestDate: string | null;
  totalRequests: number;
  hasReviewed: boolean;
}

const defaultReviewData: ReviewData = {
  lastRequestDate: null,
  totalRequests: 0,
  hasReviewed: false,
};

const getReviewData = async (): Promise<ReviewData> => {
  try {
    const stored = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading review data:', error);
  }
  return defaultReviewData;
};

const saveReviewData = async (data: ReviewData): Promise<void> => {
  try {
    await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving review data:', error);
  }
};

const shouldShowReview = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) {
    return false;
  }

  const data = await getReviewData();

  if (data.hasReviewed) {
    return false;
  }

  if (data.totalRequests >= 3) {
    return false;
  }

  if (data.lastRequestDate) {
    const lastRequest = new Date(data.lastRequestDate);
    const now = new Date();
    const daysSinceLastRequest = Math.floor(
      (now.getTime() - lastRequest.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastRequest < 30) {
      return false;
    }
  }

  return true;
};

export const requestStoreReview = async (): Promise<void> => {
  try {
    const should = await shouldShowReview();
    
    if (!should) {
      console.log('Store review: Conditions not met, skipping');
      return;
    }

    console.log('Requesting store review...');
    await StoreReview.requestReview();

    const data = await getReviewData();
    await saveReviewData({
      lastRequestDate: new Date().toISOString(),
      totalRequests: data.totalRequests + 1,
      hasReviewed: false,
    });
  } catch (error) {
    console.error('Error requesting store review:', error);
  }
};

export const markAsReviewed = async (): Promise<void> => {
  try {
    const data = await getReviewData();
    await saveReviewData({
      ...data,
      hasReviewed: true,
    });
  } catch (error) {
    console.error('Error marking as reviewed:', error);
  }
};

export const shouldTriggerReview = async (trigger: {
  type: 'perfect_week' | 'streak_milestone' | 'cycle_complete' | 'multiple_perfect_weeks';
  streakDays?: number;
  perfectWeeks?: number;
  cyclesCompleted?: number;
}): Promise<boolean> => {
  const canShow = await shouldShowReview();
  
  if (!canShow) {
    return false;
  }

  switch (trigger.type) {
    case 'perfect_week':
      return true;
    
    case 'streak_milestone':
      return trigger.streakDays ? [7, 30, 50, 100].includes(trigger.streakDays) : false;
    
    case 'cycle_complete':
      return trigger.cyclesCompleted ? trigger.cyclesCompleted >= 1 : false;
    
    case 'multiple_perfect_weeks':
      return trigger.perfectWeeks ? trigger.perfectWeeks % 3 === 0 && trigger.perfectWeeks > 0 : false;
    
    default:
      return false;
  }
};
