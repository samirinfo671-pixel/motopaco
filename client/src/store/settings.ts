import { create } from 'zustand';
import api from '../lib/api';

interface SettingsState {
  settings: Record<string, string>;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {},
  isLoading: true,
  fetchSettings: async () => {
    try {
      const response = await api.get('/settings');
      set({ settings: response.data || {}, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch settings', error);
      set({ isLoading: false });
    }
  }
}));
