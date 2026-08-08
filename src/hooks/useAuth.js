import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, register, logout, getMe, clearError } from '../redux/slices/authSlice';
import { useCallback } from 'react';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const handleLogin = useCallback(async (credentials) => {
    const result = await dispatch(login(credentials));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
      return { success: true };
    }
    return { success: false, error: result.payload };
  }, [dispatch, navigate]);

  const handleRegister = useCallback(async (data) => {
    const result = await dispatch(register(data));
    if (register.fulfilled.match(result)) {
      navigate('/dashboard');
      return { success: true };
    }
    return { success: false, error: result.payload };
  }, [dispatch, navigate]);

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const refreshUser = useCallback(() => {
    dispatch(getMe());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.role);
  }, [user]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
    clearError: handleClearError,
    hasRole,
  };
}
