import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/tasks', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
  }
});

export const fetchTask = createAsyncThunk('tasks/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/tasks/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch task');
  }
});

export const createTask = createAsyncThunk('tasks/create', async (taskData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/tasks', taskData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, ...updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/tasks/${id}`, updates);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update task');
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/tasks/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    list: [],
    current: null,
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearTaskError: (state) => { state.error = null; },
    clearCurrentTask: (state) => { state.current = null; },
    updateTaskStatus: (state, action) => {
      const { id, status } = action.payload;
      const task = state.list.find(t => t._id === id);
      if (task) task.status = status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.tasks; state.total = action.payload.total; })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTask.pending, (state) => { state.loading = true; })
      .addCase(fetchTask.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchTask.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createTask.fulfilled, (state, action) => { state.list.unshift(action.payload); state.total += 1; })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.list.findIndex(t => t._id === action.payload._id);
        if (idx >= 0) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.list = state.list.filter(t => t._id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearTaskError, clearCurrentTask, updateTaskStatus } = taskSlice.actions;
export default taskSlice.reducer;
