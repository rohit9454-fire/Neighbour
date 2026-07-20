import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './slices/authSlice';
import eventsReducer from './slices/eventsSlice';
import activitiesReducer from './slices/activitiesSlice';
import notificationsReducer from './slices/notificationsSlice';
import chatReducer from './slices/chatSlice';
import { rootSaga } from './sagas/rootSaga';
import { injectStore } from '../services/apiClient';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    activities: activitiesReducer,
    notifications: notificationsReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

// ── Break circular dependency ─────────────────────────────────────────────────
// apiClient cannot import the store directly (would create a cycle).
// We inject it here after creation so the 401 interceptor can read
// state.auth.refreshToken and dispatch refresh actions.
injectStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
