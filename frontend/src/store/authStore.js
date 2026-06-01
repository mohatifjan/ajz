import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { accessToken, refreshToken, user } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false
      });

      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false
      });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      const { accessToken, refreshToken, user } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false
      });

      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false
    });
  },

  loadUser: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await authAPI.getCurrentUser();
      set({ user: response.data.data, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ isAuthenticated: false, user: null });
    }
  }
}));
