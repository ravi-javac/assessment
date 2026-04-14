import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from './env';

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, Socket> = new Map();

  initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.frontendUrl,
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join_session', (sessionId: string) => {
        socket.join(`session:${sessionId}`);
        console.log(`Client ${socket.id} joined session ${sessionId}`);
      });

      socket.on('leave_session', (sessionId: string) => {
        socket.leave(`session:${sessionId}`);
        console.log(`Client ${socket.id} left session ${sessionId}`);
      });

      socket.on('join_room', (room: string) => {
        socket.join(room);
        console.log(`Client ${socket.id} joined room ${room}`);
      });

      socket.on('register_client', (data: { clientId: string; role: string }) => {
        this.connectedClients.set(data.clientId, socket);
        console.log(`Client registered: ${data.clientId} as ${data.role}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        for (const [clientId, sock] of this.connectedClients.entries()) {
          if (sock.id === socket.id) {
            this.connectedClients.delete(clientId);
            break;
          }
        }
      });
    });

    console.log('WebSocket server initialized');
    return this.io;
  }

  emitToSession(sessionId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`session:${sessionId}`).emit(event, data);
    }
  }

  emitToRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  emitToClient(clientId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  emitToAll(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  notifyActivity(sessionId: string, activity: any): void {
    this.emitToSession(sessionId, 'new_activity', activity);
  }

  notifyViolation(sessionId: string, attemptId: string, violation: any): void {
    this.emitToSession(sessionId, 'violation', {
      attemptId,
      ...violation,
    });
  }

  notifyWarning(attemptId: string, message: string): void {
    this.emitToClient(attemptId, 'warning', { message });
  }

  notifySessionStatus(sessionId: string, status: string): void {
    this.emitToSession(sessionId, 'session_status', { status });
  }

  notifyStudentStatus(sessionId: string, attemptId: string, status: any): void {
    this.emitToSession(sessionId, 'student_status', {
      attemptId,
      ...status,
    });
  }

  notifyTimeWarning(sessionId: string, attemptId: string, remainingSeconds: number): void {
    this.emitToClient(attemptId, 'time_warning', { remainingSeconds });
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();