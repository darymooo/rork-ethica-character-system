import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { VIRTUES } from '@/constants/virtues';

export interface DailyObservation {
  date: string;
  hasFault: boolean;
  note?: string;
}

export interface WeekRecord {
  virtueId: string;
  startDate: string;
  endDate: string;
  observations: DailyObservation[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  totalDaysLogged: number;
  perfectWeeks: number;
}

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  mood?: 'reflective' | 'grateful' | 'challenged' | 'inspired' | 'peaceful';
  tags?: string[];
}

export interface CustomVirtue {
  id: string;
  name: string;
  description: string;
  context: string;
  createdAt: string;
}

export interface AppState {
  hasCompletedOnboarding: boolean;
  hasSeenOnboarding: boolean;
  currentVirtueId: string | null;
  currentWeekStartDate: string | null;
  weekRecords: WeekRecord[];
  currentWeekObservations: DailyObservation[];
  userName?: string;
  startDate?: string;
  weekStartsMonday: boolean;
  darkMode: boolean;
  followSystemTheme: boolean;
  virtueQueue: string[];
  streakData: StreakData;
  journalEntries: JournalEntry[];
  customVirtues: CustomVirtue[];
}

const STORAGE_KEY = 'ethica_state';

const defaultState: AppState = {
  hasCompletedOnboarding: false,
  hasSeenOnboarding: false,
  currentVirtueId: null,
  currentWeekStartDate: null,
  weekRecords: [],
  currentWeekObservations: [],
  weekStartsMonday: true,
  darkMode: false,
  followSystemTheme: false,
  virtueQueue: [],
  streakData: {
    currentStreak: 0,
    longestStreak: 0,
    lastLogDate: null,
    totalDaysLogged: 0,
    perfectWeeks: 0,
  },
  journalEntries: [],
  customVirtues: [],
};

export const [EthicaProvider, useEthica] = createContextHook(() => {
  const [state, setState] = useState<AppState>(defaultState);

  const stateQuery = useQuery({
    queryKey: ['ethica-state'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultState, ...parsed };
      }
      return defaultState;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newState: AppState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    },
  });

  useEffect(() => {
    if (stateQuery.data) {
      const loadedState = stateQuery.data;
      const validatedState = validateStreakOnLoad(loadedState);
      setState(validatedState);
      
      if (validatedState.streakData.currentStreak !== loadedState.streakData.currentStreak) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validatedState));
      }
    }
  }, [stateQuery.data]);

  const validateStreakOnLoad = (loadedState: AppState): AppState => {
    const { streakData } = loadedState;
    if (!streakData.lastLogDate || streakData.currentStreak === 0) {
      return loadedState;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastLog = new Date(streakData.lastLogDate);
    lastLog.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - lastLog.getTime()) / 86400000);
    
    if (diffDays > 1) {
      console.log(`Streak broken: ${diffDays} days since last log`);
      return {
        ...loadedState,
        streakData: {
          ...streakData,
          currentStreak: 0,
        },
      };
    }
    
    return loadedState;
  };

  const updateState = (updates: Partial<AppState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    saveMutation.mutate(newState);
  };

  const completeOnboarding = (virtueId: string) => {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    updateState({
      hasCompletedOnboarding: true,
      currentVirtueId: virtueId,
      currentWeekStartDate: startDate,
      startDate: startDate,
    });
  };

  const [lastObservation, setLastObservation] = useState<{
    date: string;
    previous: DailyObservation | null;
    timestamp: number;
  } | null>(null);

  const updateStreakData = (date: string, isNewLog: boolean): StreakData => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastLog = state.streakData.lastLogDate;
    
    let newStreak = state.streakData.currentStreak;
    let newTotalDays = state.streakData.totalDaysLogged;
    
    if (isNewLog) {
      newTotalDays += 1;
      
      if (!lastLog || date === today || date === yesterday) {
        if (lastLog === yesterday || lastLog === today) {
          newStreak = state.streakData.currentStreak + 1;
        } else if (!lastLog) {
          newStreak = 1;
        } else {
          const lastLogDate = new Date(lastLog);
          const currentDate = new Date(date);
          const diffDays = Math.floor((currentDate.getTime() - lastLogDate.getTime()) / 86400000);
          
          if (diffDays === 1) {
            newStreak = state.streakData.currentStreak + 1;
          } else {
            newStreak = 1;
          }
        }
      } else {
        newStreak = 1;
      }
    }
    
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(state.streakData.longestStreak, newStreak),
      lastLogDate: date > (lastLog || '') ? date : lastLog,
      totalDaysLogged: newTotalDays,
      perfectWeeks: state.streakData.perfectWeeks,
    };
  };

  const logObservation = (date: string, hasFault: boolean, note?: string) => {
    const existingIndex = state.currentWeekObservations.findIndex(obs => obs.date === date);
    let updatedObservations: DailyObservation[];
    const previousObservation = existingIndex >= 0 ? state.currentWeekObservations[existingIndex] : null;
    const isNewLog = existingIndex < 0;
    
    if (existingIndex >= 0) {
      updatedObservations = [...state.currentWeekObservations];
      updatedObservations[existingIndex] = { date, hasFault, note };
    } else {
      updatedObservations = [...state.currentWeekObservations, { date, hasFault, note }];
    }
    
    setLastObservation({
      date,
      previous: previousObservation,
      timestamp: Date.now(),
    });
    
    const newStreakData = updateStreakData(date, isNewLog);
    updateState({ currentWeekObservations: updatedObservations, streakData: newStreakData });
  };

  const undoLastObservation = (): boolean => {
    if (!lastObservation) return false;
    
    const timeSinceLog = Date.now() - lastObservation.timestamp;
    if (timeSinceLog > 5000) return false;
    
    const { date, previous } = lastObservation;
    let updatedObservations: DailyObservation[];
    
    if (previous) {
      const index = state.currentWeekObservations.findIndex(obs => obs.date === date);
      updatedObservations = [...state.currentWeekObservations];
      updatedObservations[index] = previous;
    } else {
      updatedObservations = state.currentWeekObservations.filter(obs => obs.date !== date);
    }
    
    setLastObservation(null);
    updateState({ currentWeekObservations: updatedObservations });
    return true;
  };

  const getCurrentWeekObservations = (): DailyObservation[] => {
    return state.currentWeekObservations;
  };

  const completeWeek = (observations: DailyObservation[]) => {
    if (!state.currentVirtueId || !state.currentWeekStartDate) return;

    const startDate = new Date(state.currentWeekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const newRecord: WeekRecord = {
      virtueId: state.currentVirtueId,
      startDate: state.currentWeekStartDate,
      endDate: endDate.toISOString().split('T')[0],
      observations,
    };

    const isPerfectWeek = observations.length === 7 && observations.every(o => !o.hasFault);
    const newStreakData = {
      ...state.streakData,
      perfectWeeks: state.streakData.perfectWeeks + (isPerfectWeek ? 1 : 0),
    };

    updateState({
      weekRecords: [...state.weekRecords, newRecord],
      currentVirtueId: null,
      currentWeekStartDate: null,
      currentWeekObservations: [],
      streakData: newStreakData,
    });
  };

  const startNewWeek = async (virtueId: string) => {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    updateState({
      currentVirtueId: virtueId,
      currentWeekStartDate: startDate,
      currentWeekObservations: [],
    });
  };

  const isWeekComplete = (): boolean => {
    if (!state.currentWeekStartDate) return false;
    
    const startDate = new Date(state.currentWeekStartDate);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / 86400000);
    return daysPassed >= 7;
  };

  const getDaysRemainingInWeek = (): number => {
    if (!state.currentWeekStartDate) return 0;
    
    const startDate = new Date(state.currentWeekStartDate);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / 86400000);
    return Math.max(0, 7 - daysPassed);
  };

  const getVirtueHistory = (virtueId: string): WeekRecord[] => {
    return state.weekRecords.filter(r => r.virtueId === virtueId);
  };

  const addToVirtueQueue = (virtueId: string) => {
    if (!state.virtueQueue.includes(virtueId)) {
      updateState({ virtueQueue: [...state.virtueQueue, virtueId] });
    }
  };

  const removeFromVirtueQueue = (virtueId: string) => {
    updateState({ virtueQueue: state.virtueQueue.filter(id => id !== virtueId) });
  };

  const reorderVirtueQueue = (newQueue: string[]) => {
    updateState({ virtueQueue: newQueue });
  };

  const getNextQueuedVirtue = (): string | null => {
    return state.virtueQueue[0] || null;
  };

  const consumeQueuedVirtue = () => {
    if (state.virtueQueue.length > 0) {
      const [next, ...rest] = state.virtueQueue;
      updateState({ virtueQueue: rest });
      return next;
    }
    return null;
  };

  const getCycleProgress = (): { current: number; total: number; percentage: number; cycleNumber: number } => {
    const totalWeeksCompleted = state.weekRecords.length;
    const cycleNumber = Math.floor(totalWeeksCompleted / 13) + 1;
    const positionInCycle = (totalWeeksCompleted % 13) + (state.currentVirtueId ? 1 : 0);
    const currentCount = Math.min(positionInCycle, 13);
    return {
      current: currentCount,
      total: 13,
      percentage: Math.round((currentCount / 13) * 100),
      cycleNumber,
    };
  };

  interface VirtueStats {
    virtueId: string;
    attempts: number;
    totalFaults: number;
    avgFaults: number;
    lastAttemptDate?: string;
  }

  const getVirtueStatistics = (): VirtueStats[] => {
    const statsMap = new Map<string, VirtueStats>();

    state.weekRecords.forEach(record => {
      const faultCount = record.observations.filter(obs => obs.hasFault).length;
      const existing = statsMap.get(record.virtueId);

      if (existing) {
        existing.attempts += 1;
        existing.totalFaults += faultCount;
        existing.avgFaults = existing.totalFaults / existing.attempts;
        if (!existing.lastAttemptDate || record.endDate > existing.lastAttemptDate) {
          existing.lastAttemptDate = record.endDate;
        }
      } else {
        statsMap.set(record.virtueId, {
          virtueId: record.virtueId,
          attempts: 1,
          totalFaults: faultCount,
          avgFaults: faultCount,
          lastAttemptDate: record.endDate,
        });
      }
    });

    return Array.from(statsMap.values());
  };

  const getNeverAttemptedVirtues = (): string[] => {
    const attemptedVirtues = new Set(state.weekRecords.map(r => r.virtueId));
    const allVirtueIds = ['temperance', 'silence', 'order', 'resolution', 'frugality', 'industry', 'sincerity', 'justice', 'moderation', 'cleanliness', 'tranquility', 'chastity', 'humility'];
    return allVirtueIds.filter(id => !attemptedVirtues.has(id) && id !== state.currentVirtueId);
  };

  const getVirtuesNeedingImprovement = (): string[] => {
    const stats = getVirtueStatistics();
    return stats
      .filter(s => s.attempts > 0)
      .sort((a, b) => b.avgFaults - a.avgFaults)
      .slice(0, 3)
      .map(s => s.virtueId);
  };

  const getDetailedAnalytics = () => {
    const totalWeeks = state.weekRecords.length;
    const totalFaults = state.weekRecords.reduce((sum, week) => 
      sum + week.observations.filter(o => o.hasFault).length, 0
    );
    const totalObservations = state.weekRecords.reduce((sum, week) => 
      sum + week.observations.length, 0
    ) + state.currentWeekObservations.length;
    
    const perfectWeeks = state.weekRecords.filter(week => 
      week.observations.length === 7 && week.observations.every(o => !o.hasFault)
    ).length;
    
    const virtueAttempts = new Map<string, number>();
    const virtueFaults = new Map<string, number>();
    
    state.weekRecords.forEach(week => {
      virtueAttempts.set(week.virtueId, (virtueAttempts.get(week.virtueId) || 0) + 1);
      const faults = week.observations.filter(o => o.hasFault).length;
      virtueFaults.set(week.virtueId, (virtueFaults.get(week.virtueId) || 0) + faults);
    });
    
    const mostPracticedVirtue = Array.from(virtueAttempts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    const strongestVirtue = Array.from(virtueAttempts.entries())
      .filter(([id, attempts]) => attempts > 0)
      .map(([id, attempts]) => ({
        id,
        avgFaults: (virtueFaults.get(id) || 0) / attempts
      }))
      .sort((a, b) => a.avgFaults - b.avgFaults)[0]?.id || null;
    
    const weakestVirtue = Array.from(virtueAttempts.entries())
      .filter(([id, attempts]) => attempts > 0)
      .map(([id, attempts]) => ({
        id,
        avgFaults: (virtueFaults.get(id) || 0) / attempts
      }))
      .sort((a, b) => b.avgFaults - a.avgFaults)[0]?.id || null;
    
    const weeklyFaultTrend = state.weekRecords.slice(-8).map(week => ({
      weekStart: week.startDate,
      virtueId: week.virtueId,
      faults: week.observations.filter(o => o.hasFault).length,
      observations: week.observations.length,
    }));
    
    const completedCycles = Math.floor(totalWeeks / 13);
    
    return {
      totalWeeks,
      totalFaults,
      totalObservations,
      perfectWeeks,
      completedCycles,
      mostPracticedVirtue,
      strongestVirtue,
      weakestVirtue,
      weeklyFaultTrend,
      avgFaultsPerWeek: totalWeeks > 0 ? (totalFaults / totalWeeks).toFixed(1) : '0',
      successRate: totalObservations > 0 
        ? Math.round(((totalObservations - totalFaults) / totalObservations) * 100)
        : 100,
    };
  };

  const getStreakData = (): StreakData => {
    return state.streakData;
  };

  const addJournalEntry = (content: string, mood?: JournalEntry['mood'], tags?: string[]) => {
    const now = new Date().toISOString();
    const newEntry: JournalEntry = {
      id: `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      createdAt: now,
      updatedAt: now,
      mood,
      tags,
    };
    updateState({ journalEntries: [newEntry, ...state.journalEntries] });
    return newEntry;
  };

  const updateJournalEntry = (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) => {
    const updatedEntries = state.journalEntries.map(entry =>
      entry.id === id
        ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
        : entry
    );
    updateState({ journalEntries: updatedEntries });
  };

  const deleteJournalEntry = (id: string) => {
    updateState({ journalEntries: state.journalEntries.filter(entry => entry.id !== id) });
  };

  const getJournalEntries = () => {
    return state.journalEntries;
  };

  const addCustomVirtue = (name: string, description: string, context: string) => {
    const now = new Date().toISOString();
    const newVirtue: CustomVirtue = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      context,
      createdAt: now,
    };
    updateState({ customVirtues: [...state.customVirtues, newVirtue] });
    return newVirtue;
  };

  const updateCustomVirtue = (id: string, updates: Partial<Omit<CustomVirtue, 'id' | 'createdAt'>>) => {
    const updatedVirtues = state.customVirtues.map(virtue =>
      virtue.id === id ? { ...virtue, ...updates } : virtue
    );
    updateState({ customVirtues: updatedVirtues });
  };

  const deleteCustomVirtue = (id: string) => {
    updateState({ customVirtues: state.customVirtues.filter(virtue => virtue.id !== id) });
  };

  const getCustomVirtues = () => {
    return state.customVirtues;
  };

  const resetData = () => {
    setState(defaultState);
    saveMutation.mutate(defaultState);
  };

  return {
    state,
    updateState,
    completeOnboarding,
    logObservation,
    undoLastObservation,
    getCurrentWeekObservations,
    completeWeek,
    startNewWeek,
    getVirtueHistory,
    addToVirtueQueue,
    removeFromVirtueQueue,
    reorderVirtueQueue,
    getNextQueuedVirtue,
    consumeQueuedVirtue,
    getCycleProgress,
    getVirtueStatistics,
    getNeverAttemptedVirtues,
    getVirtuesNeedingImprovement,
    getDetailedAnalytics,
    getStreakData,
    isWeekComplete,
    getDaysRemainingInWeek,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalEntries,
    addCustomVirtue,
    updateCustomVirtue,
    deleteCustomVirtue,
    getCustomVirtues,
    resetData,
    isLoading: stateQuery.isLoading,
    isSaving: saveMutation.isPending,
  };
});
