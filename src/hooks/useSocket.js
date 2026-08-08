import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';
import { useSelector } from 'react-redux';

export function useSocket() {
  const { token } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      connectSocket(token);
      socketRef.current = getSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  const emit = useCallback((event, data) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    const socket = getSocket();
    if (socket) {
      socket.on(event, handler);
      return () => socket.off(event, handler);
    }
    return () => {};
  }, []);

  const joinProject = useCallback((projectId) => {
    emit('join_project', projectId);
  }, [emit]);

  const leaveProject = useCallback((projectId) => {
    emit('leave_project', projectId);
  }, [emit]);

  return {
    socket: socketRef.current,
    emit,
    on,
    joinProject,
    leaveProject,
    isConnected: socketRef.current?.connected || false,
  };
}
