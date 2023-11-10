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
    toggleEnabled: (state) => {
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
export const selectSiteBlockList = (state: RootState) => state.settings.siteBlockList;
export const selectBlockedSite = (state: RootState, site: string) => state.settings.siteBlockList.includes(site);

export default settingsSlice.reducer;

export function onMessage(message: any) {
  return async (dispatch: Function, getState: Function) => {
    switch (message.type) {
      case "TOGGLE_ENABLED":
        if(!getState().settings.enabled) {
          dispatch(toggleEnabled())
        }
        break;
      case "TOGGLE_DISABLED":
        if(getState().settings.enabled) {
          dispatch(toggleEnabled())
        }
        break;
    }
  }
}