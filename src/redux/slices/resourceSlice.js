import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Materials
export const fetchMaterials = createAsyncThunk('resources/fetchMaterials', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/materials', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch materials');
  }
});

export const createMaterial = createAsyncThunk('resources/createMaterial', async (materialData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/materials', materialData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create material');
  }
});

export const updateMaterial = createAsyncThunk('resources/updateMaterial', async ({ id, ...updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/materials/${id}`, updates);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update material');
  }
});

export const deleteMaterial = createAsyncThunk('resources/deleteMaterial', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/materials/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete material');
  }
});

// Equipment
export const fetchEquipment = createAsyncThunk('resources/fetchEquipment', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/equipment', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch equipment');
  }
});

export const createEquipment = createAsyncThunk('resources/createEquipment', async (equipmentData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/equipment', equipmentData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create equipment');
  }
});

export const updateEquipment = createAsyncThunk('resources/updateEquipment', async ({ id, ...updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/equipment/${id}`, updates);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update equipment');
  }
});

export const deleteEquipment = createAsyncThunk('resources/deleteEquipment', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/api/equipment/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete equipment');
  }
});

const resourceSlice = createSlice({
  name: 'resources',
  initialState: {
    materials: [],
    equipment: [],
    materialTotal: 0,
    equipmentTotal: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearResourceError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Materials
      .addCase(fetchMaterials.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMaterials.fulfilled, (state, action) => { state.loading = false; state.materials = action.payload.materials; state.materialTotal = action.payload.total; })
      .addCase(fetchMaterials.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createMaterial.fulfilled, (state, action) => { state.materials.unshift(action.payload); state.materialTotal += 1; })
      .addCase(updateMaterial.fulfilled, (state, action) => {
        const idx = state.materials.findIndex(m => m._id === action.payload._id);
        if (idx >= 0) state.materials[idx] = action.payload;
      })
      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.materials = state.materials.filter(m => m._id !== action.payload);
        state.materialTotal -= 1;
      })
      // Equipment
      .addCase(fetchEquipment.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEquipment.fulfilled, (state, action) => { state.loading = false; state.equipment = action.payload.equipment; state.equipmentTotal = action.payload.total; })
      .addCase(fetchEquipment.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createEquipment.fulfilled, (state, action) => { state.equipment.unshift(action.payload); state.equipmentTotal += 1; })
      .addCase(updateEquipment.fulfilled, (state, action) => {
        const idx = state.equipment.findIndex(e => e._id === action.payload._id);
        if (idx >= 0) state.equipment[idx] = action.payload;
      })
      .addCase(deleteEquipment.fulfilled, (state, action) => {
        state.equipment = state.equipment.filter(e => e._id !== action.payload);
        state.equipmentTotal -= 1;
      });
  },
});

export const { clearResourceError } = resourceSlice.actions;
export default resourceSlice.reducer;
