import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface SettingsState {
  enabled: boolean;
  siteBlockList: string[];
}

const initialState: SettingsState = {
  enabled: true,
  siteBlockList: [],
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleEnabled: (state, action: PayloadAction<string>) => {
      state.enabled = !state.enabled;
    },
    addSiteToBlockList: (state, action: PayloadAction<string>) => {
      state.siteBlockList.push(action.payload);
    },
    removeSiteFromBlockList: (state, action: PayloadAction<string>) => {
      state.siteBlockList = state.siteBlockList.filter(site => site !== action.payload);
    }
  },
});

export const { toggleEnabled } = settingsSlice.actions;

export const selectEnabled = (state: RootState) => state.settings.enabled;

export default settingsSlice.reducer;