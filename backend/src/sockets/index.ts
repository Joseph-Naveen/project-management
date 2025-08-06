import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import config from '../config/app';
import { User } from '../models';

// Socket event types
export interface SocketEvents {
  // User presence
  'user:online': (data: { userId: string; timestamp: string }) => void;
  'user:offline': (data: { userId: string; timestamp: string }) => void;
  
  // Project events
  'project:update': (data: { project: any }) => void;
  'project:create': (data: { project: any }) => void;
  'project:delete': (data: { projectId: string }) => void;
  'project:member:add': (data: { projectId: string; member: any }) => void;
  'project:member:remove': (data: { projectId: string; userId: string }) => void;
  
  // Task events
  'task:update': (data: { task: any }) => void;
  'task:create': (data: { task: any }) => void;
  'task:delete': (data: { taskId: string }) => void;
  'task:move': (data: { taskId: string; oldStatus: string; newStatus: string }) => void;
  'task:assign': (data: { taskId: string; assigneeId: string }) => void;
  
  // Comment events
  'comment:new': (data: { comment: any }) => void;
  'comment:update': (data: { comment: any }) => void;
  'comment:delete': (data: { commentId: string }) => void;
  'comment:reaction': (data: { commentId: string; reaction: any }) => void;
  
  // Notification events
  'notification:new': (data: { notification: any }) => void;
  'notification:read': (data: { notificationId: string }) => void;
  
  // Time tracking events
  'time:start': (data: { timeLog: any }) => void;
  'time:stop': (data: { timeLog: any }) => void;
  'time:update': (data: { timeLog: any }) => void;
  
  // Activity events
  'activity:new': (data: { activity: any }) => void;
  
  // Dashboard events
  'dashboard:stats-update': (data: { stats: any }) => void;
  'kanban:update': (data: { task: any; oldStatus: string; newStatus: string }) => void;
}

// Socket authentication middleware
const authenticateSocket = async (token: string): Promise<any> => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as string) as any;
    const user = await User.findByPk(decoded.userId);
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Socket event handlers
const setupSocketHandlers = (io: SocketIOServer) => {
  // Handle user connections
  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    
    // Authenticate user
    try {
      const token = socket.handshake.auth['token'] || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        socket.disconnect();
        return;
      }
      
      const user = await authenticateSocket(token);
      if (!user) {
        socket.disconnect();
        return;
      }
      
      // Store user info in socket
      socket.data.user = user;
      
      // Join user to their personal room
      socket.join(`user:${user.id}`);
      
      // Join user to project rooms they're members of
      const userProjects = await user.getProjects();
      userProjects.forEach((project: any) => {
        socket.join(`project:${project.id}`);
      });
      
      // Emit user online event
      socket.broadcast.emit('user:online', {
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ User authenticated: ${user.email} (${socket.id})`);
      
    } catch (error) {
      console.error('❌ Socket authentication failed:', error);
      socket.disconnect();
      return;
    }
    
    // Handle user disconnection
    socket.on('disconnect', () => {
      const user = socket.data.user;
      if (user) {
        socket.broadcast.emit('user:offline', {
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        console.log(`🔌 User disconnected: ${user.email} (${socket.id})`);
      }
    });
    
    // Handle project events
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`📁 User joined project: ${projectId}`);
    });
    
    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`📁 User left project: ${projectId}`);
    });
    
    // Handle task events
    socket.on('task:join', (taskId: string) => {
      socket.join(`task:${taskId}`);
      console.log(`📋 User joined task: ${taskId}`);
    });
    
    socket.on('task:leave', (taskId: string) => {
      socket.leave(`task:${taskId}`);
      console.log(`📋 User left task: ${taskId}`);
    });
    
    // Handle typing indicators
    socket.on('comment:typing:start', (data: { taskId?: string; projectId?: string }) => {
      const room = data.taskId ? `task:${data.taskId}` : `project:${data.projectId}`;
      socket.to(room).emit('comment:typing:start', {
        userId: socket.data.user.id,
        userName: socket.data.user.name
      });
    });
    
    socket.on('comment:typing:stop', (data: { taskId?: string; projectId?: string }) => {
      const room = data.taskId ? `task:${data.taskId}` : `project:${data.projectId}`;
      socket.to(room).emit('comment:typing:stop', {
        userId: socket.data.user.id
      });
    });
  });
};

// Socket server setup
export const setupSocketServer = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true
    },
    transports: ['websocket', 'polling']
  });
  
  // Setup event handlers
  setupSocketHandlers(io);
  
  console.log('🔌 Socket.io server initialized');
  
  return io;
};

// Export socket instance for use in controllers
export let socketIO: SocketIOServer;

export const setSocketIO = (io: SocketIOServer) => {
  socketIO = io;
};

// Helper functions to emit events from controllers
export const emitToProject = (projectId: string, event: string, data: any) => {
  if (socketIO) {
    socketIO.to(`project:${projectId}`).emit(event, data);
  }
};

export const emitToTask = (taskId: string, event: string, data: any) => {
  if (socketIO) {
    socketIO.to(`task:${taskId}`).emit(event, data);
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (socketIO) {
    socketIO.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToAll = (event: string, data: any) => {
  if (socketIO) {
    socketIO.emit(event, data);
  }
}; 