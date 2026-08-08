import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDocuments = createAsyncThunk('documents/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/documents', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch documents');
  }
});

export const uploadDocument = createAsyncThunk('documents/upload', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to upload document');
  }
});

export const deleteDocument = createAsyncThunk('documents/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/documents/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
  }
});

const documentSlice = createSlice({
  name: 'documents',
  initialState: {
    list: [],
    total: 0,
    loading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    clearDocumentError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDocuments.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.documents || action.payload; state.total = action.payload.total || state.list.length; })
      .addCase(fetchDocuments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(uploadDocument.pending, (state) => { state.uploading = true; })
      .addCase(uploadDocument.fulfilled, (state, action) => { state.uploading = false; state.list.unshift(action.payload); state.total += 1; })
      .addCase(uploadDocument.rejected, (state, action) => { state.uploading = false; state.error = action.payload; })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.list = state.list.filter(d => d._id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearDocumentError } = documentSlice.actions;
export default documentSlice.reducer;
