import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchWorkers = createAsyncThunk('workers/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/workers', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch workers');
  }
});

export const createWorker = createAsyncThunk('workers/create', async (workerData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/workers', workerData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create worker');
  }
});

export const updateWorker = createAsyncThunk('workers/update', async ({ id, ...updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/workers/${id}`, updates);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update worker');
  }
});

export const deleteWorker = createAsyncThunk('workers/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/workers/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete worker');
  }
});

export const markAttendance = createAsyncThunk('workers/markAttendance', async ({ id, ...attendance }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/api/workers/${id}/attendance`, attendance);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark attendance');
  }
});

const workerSlice = createSlice({
  name: 'workers',
  initialState: {
    list: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearWorkerError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWorkers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.workers; state.total = action.payload.total; })
      .addCase(fetchWorkers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createWorker.fulfilled, (state, action) => { state.list.unshift(action.payload); state.total += 1; })
      .addCase(updateWorker.fulfilled, (state, action) => {
        const idx = state.list.findIndex(w => w._id === action.payload._id);
        if (idx >= 0) state.list[idx] = action.payload;
      })
      .addCase(deleteWorker.fulfilled, (state, action) => {
        state.list = state.list.filter(w => w._id !== action.payload);
        state.total -= 1;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        const idx = state.list.findIndex(w => w._id === action.payload._id);
        if (idx >= 0) state.list[idx] = action.payload;
      });
  },
});

export const { clearWorkerError } = workerSlice.actions;
export default workerSlice.reducer;
