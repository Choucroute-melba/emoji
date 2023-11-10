import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface SettingsState {
  theme: string;
}

const initialState: SettingsState = {
  theme: 'light',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = settingsSlice.actions;

export const selectTheme = (state: RootState) => state.settings.theme;

export default settingsSlice.reducer;