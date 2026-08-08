import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectReducer from './slices/projectSlice';
import taskReducer from './slices/taskSlice';
import resourceReducer from './slices/resourceSlice';
import workerReducer from './slices/workerSlice';
import expenseReducer from './slices/expenseSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import documentReducer from './slices/documentSlice';
import uiReducer from './slices/uiSlice';
import bimReducer from './slices/bimSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    tasks: taskReducer,
    resources: resourceReducer,
    workers: workerReducer,
    expenses: expenseReducer,
    chat: chatReducer,
    notifications: notificationReducer,
    documents: documentReducer,
    ui: uiReducer,
    bim: bimReducer,
  },
});
