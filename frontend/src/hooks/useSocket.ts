import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services';

export interface UseSocketOptions {
  autoConnect?: boolean;
  room?: string;
  events?: string[];
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, room } = options;
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Connect to socket
  const connect = useCallback(async () => {
    try {
      if (!socketService.isSocketConnected()) {
        await socketService.connect();
      }
    } catch (error) {
      console.error('Failed to connect to socket:', error);
    }
  }, []);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  // Join a room
  const joinRoom = useCallback((roomName: string) => {
    socketService.joinRoom(roomName);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((roomName: string) => {
    socketService.leaveRoom(roomName);
  }, []);

  // Subscribe to an event
  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    const unsubscribe = socketService.subscribe(eventType, callback);
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Emit an event
  const emit = useCallback((eventType: string, data: any) => {
    socketService.emit(eventType, data);
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return socketService.getConnectionStatus();
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Join room if specified
    if (room) {
      joinRoom(room);
    }

    // Cleanup on unmount
    return () => {
      // Leave room if specified
      if (room) {
        leaveRoom(room);
      }

      // Unsubscribe from all events
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [autoConnect, room, connect, joinRoom, leaveRoom]);

  return {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    subscribe,
    emit,
    getConnectionStatus,
    isConnected: socketService.isSocketConnected(),
  };
};

// Specialized hooks for common use cases
export const useTaskSocket = (taskId?: string) => {
  const room = taskId ? `task:${taskId}` : undefined;
  
  const socket = useSocket({
    autoConnect: !!taskId,
    room,
    events: ['task:update', 'comment:new', 'comment:update', 'comment:delete', 'time:start', 'time:stop']
  });

  return socket;
};

export const useProjectSocket = (projectId?: string) => {
  const room = projectId ? `project:${projectId}` : undefined;
  
  const socket = useSocket({
    autoConnect: !!projectId,
    room,
    events: ['project:update', 'task:update', 'comment:new', 'activity:new']
  });

  return socket;
};

export const useNotificationSocket = () => {
  const socket = useSocket({
    autoConnect: true,
    events: ['notification:new']
  });

  return socket;
};

export const useUserPresenceSocket = () => {
  const socket = useSocket({
    autoConnect: true,
    events: ['user:online', 'user:offline']
  });

  return socket;
}; 