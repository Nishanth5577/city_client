import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchExpenses = createAsyncThunk('expenses/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/expenses', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
  }
});

export const createExpense = createAsyncThunk('expenses/create', async (expenseData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/expenses', expenseData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create expense');
  }
});

export const updateExpense = createAsyncThunk('expenses/update', async ({ id, ...updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/expenses/${id}`, updates);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update expense');
  }
});

export const approveExpense = createAsyncThunk('expenses/approve', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/expenses/${id}/approve`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to approve expense');
  }
});

export const rejectExpense = createAsyncThunk('expenses/reject', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/expenses/${id}/reject`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to reject expense');
  }
});

export const deleteExpense = createAsyncThunk('expenses/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/expenses/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete expense');
  }
});

const expenseSlice = createSlice({
  name: 'expenses',
  initialState: {
    list: [],
    total: 0,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearExpenseError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchExpenses.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.expenses; state.total = action.payload.total; state.stats = action.payload.stats; })
      .addCase(fetchExpenses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createExpense.fulfilled, (state, action) => { state.list.unshift(action.payload); state.total += 1; })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const idx = state.list.findIndex(e => e._id === action.payload._id);
        if (idx >= 0) state.list[idx] = action.payload;
      })
      .addCase(approveExpense.fulfilled, (state, action) => {
        const idx = state.list.findIndex(e => e._id === action.payload._id);
        if (idx >= 0) state.list[idx] = action.payload;
      })
      .addCase(rejectExpense.fulfilled, (state, action) => {
        const idx = state.list.findIndex(e => e._id === action.payload._id);
        if (idx >= 0) state.list[idx] = action.payload;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.list = state.list.filter(e => e._id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearExpenseError } = expenseSlice.actions;
export default expenseSlice.reducer;
