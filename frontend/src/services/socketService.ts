import { io, Socket } from 'socket.io-client';
import { TokenManager } from './apiClient';

export interface SocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface TaskUpdateEvent {
  taskId: string;
  task: any;
  updatedBy: string;
}

export interface CommentEvent {
  commentId: string;
  comment: any;
  taskId?: string;
  projectId?: string;
}

export interface NotificationEvent {
  notificationId: string;
  notification: any;
}

export interface TimeTrackingEvent {
  timeLogId: string;
  timeLog: any;
  action: 'start' | 'stop';
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Initialize socket connection
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const authToken = token || TokenManager.getAccessToken();
        
        if (!authToken) {
          reject(new Error('No authentication token available'));
          return;
        }

        this.socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001', {
          auth: {
            token: authToken
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
        });

        this.setupEventHandlers();
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // Handle task updates
    this.socket.on('task:update', (data: TaskUpdateEvent) => {
      this.emitEvent('task:update', data);
    });

    this.socket.on('task:move', (data: { taskId: string; oldStatus: string; newStatus: string }) => {
      this.emitEvent('task:move', data);
    });

    // Handle comment events
    this.socket.on('comment:new', (data: CommentEvent) => {
      this.emitEvent('comment:new', data);
    });

    this.socket.on('comment:update', (data: CommentEvent) => {
      this.emitEvent('comment:update', data);
    });

    this.socket.on('comment:delete', (data: { commentId: string }) => {
      this.emitEvent('comment:delete', data);
    });

    // Handle notification events
    this.socket.on('notification:new', (data: NotificationEvent) => {
      this.emitEvent('notification:new', data);
    });

    // Handle time tracking events
    this.socket.on('time:start', (data: TimeTrackingEvent) => {
      this.emitEvent('time:start', data);
    });

    this.socket.on('time:stop', (data: TimeTrackingEvent) => {
      this.emitEvent('time:stop', data);
    });

    // Handle project updates
    this.socket.on('project:update', (data: { project: any }) => {
      this.emitEvent('project:update', data);
    });

    // Handle user presence
    this.socket.on('user:online', (data: { userId: string; timestamp: string }) => {
      this.emitEvent('user:online', data);
    });

    this.socket.on('user:offline', (data: { userId: string; timestamp: string }) => {
      this.emitEvent('user:offline', data);
    });

    // Handle activity events
    this.socket.on('activity:new', (data: { activity: any }) => {
      this.emitEvent('activity:new', data);
    });
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in socket event listener:', error);
        }
      });
    }
  }

  /**
   * Subscribe to socket events
   */
  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Unsubscribe from socket events
   */
  unsubscribe(eventType: string, callback?: (data: any) => void): void {
    if (callback) {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    } else {
      // Unsubscribe all listeners for this event type
      this.eventListeners.delete(eventType);
    }
  }

  /**
   * Emit an event to the server
   */
  emit(eventType: string, data: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', eventType);
    }
  }

  /**
   * Join a room (for real-time updates)
   */
  joinRoom(room: string): void {
    this.emit('join:room', { room });
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.emit('leave:room', { room });
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export const socketService = new SocketService(); 