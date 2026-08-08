import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/notifications', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
  }
});

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/notifications/${id}/read`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
  }
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await api.put('/api/notifications/read-all');
    return true;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    unreadCount: 0,
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.list.unshift(action.payload);
      state.unreadCount += 1;
      state.total += 1;
    },
    setUnreadCount: (state, action) => { state.unreadCount = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.notifications || action.payload;
        state.total = action.payload.total || state.list.length;
        state.unreadCount = state.list.filter(n => n.status === 'unread').length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const idx = state.list.findIndex(n => n._id === action.payload._id);
        if (idx >= 0) { state.list[idx] = action.payload; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.list = state.list.map(n => ({ ...n, status: 'read' }));
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
