import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    sidebarCollapsed: false,
    currentProject: null,
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    toggleSidebarCollapse: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setCurrentProject: (state, action) => { state.currentProject = action.payload; },
    setNotifications: (state, action) => { state.notifications = action.payload; },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    setUnreadCount: (state, action) => { state.unreadCount = action.payload; },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleSidebarCollapse, setCurrentProject, setNotifications, addNotification, setUnreadCount } = uiSlice.actions;
export default uiSlice.reducer;
