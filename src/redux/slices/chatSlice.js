import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/chat/conversations');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
  }
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (userId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/chat/conversation/${userId}`);
    return { userId, messages: data.messages || [] };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
  }
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ receiver, message }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/chat/message', { receiver, message });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send message');
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    messages: [],
    selectedUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedUser: (state, action) => { state.selectedUser = action.payload; },
    addMessage: (state, action) => { state.messages.push(action.payload); },
    clearChat: (state) => { state.messages = []; state.selectedUser = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => { state.loading = true; })
      .addCase(fetchConversations.fulfilled, (state, action) => { state.loading = false; state.conversations = action.payload || []; })
      .addCase(fetchConversations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMessages.fulfilled, (state, action) => { state.messages = action.payload.messages; })
      .addCase(sendMessage.fulfilled, (state, action) => { state.messages.push(action.payload); });
  },
});

export const { setSelectedUser, addMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
