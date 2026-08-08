import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/projects', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
  }
});

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/projects/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
  }
});

export const createProject = createAsyncThunk('projects/create', async (projectData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/projects', projectData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create project');
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, ...updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/projects/${id}`, updates);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update project');
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/projects/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    list: [],
    current: null,
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearProjectError: (state) => { state.error = null; },
    clearCurrentProject: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.projects; state.total = action.payload.total; })
      .addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchProject.pending, (state) => { state.loading = true; })
      .addCase(fetchProject.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchProject.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createProject.fulfilled, (state, action) => { state.list.unshift(action.payload); state.total += 1; })
      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.list.findIndex(p => p._id === action.payload._id);
        if (idx >= 0) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = { ...state.current, ...action.payload };
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p._id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearProjectError, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
