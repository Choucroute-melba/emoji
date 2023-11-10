import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import emojiReducer from '../features/emoji/emojiSlice';
import settingsReducer from '../features/preferences/settingsSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    emoji: emojiReducer,
    settings: settingsReducer
  },
  middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['emoji/setFocusedTextField'],
          // Ignore these field paths in all actions
          ignoredActionPaths: ['emoji.focusedTextField', 'emoji.textFields'],
          // Ignore these paths in the state
          ignoredPaths: ['emoji.focusedTextField', 'emoji.textFields'],
        },
      })
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
