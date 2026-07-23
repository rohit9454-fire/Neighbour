/**
 * Socket Service
 * 
 * Manages WebSocket connection to the server using Socket.io for real-time chat.
 * Handles connection lifecycle, authentication, and message events.
 */
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types';

// Socket server URL — must point to the same host as the REST API.
// The socket server typically runs on the same origin without the /api path prefix.
const SOCKET_URL = 'https://neighbourconnect-s2lb-production.up.railway.app';

type MessageListener = (message: ChatMessage) => void;
type TypingListener = (data: { activityId: string; users: string[] }) => void;
type ConnectionListener = (connected: boolean) => void;

class SocketService {
  private socket: Socket | null = null;
  private messageListeners: Map<string, Set<MessageListener>> = new Map();
  private typingListeners: Map<string, Set<TypingListener>> = new Map();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to the WebSocket server with authentication token.
   * Call this after successful login or token refresh.
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return;
    }

    console.log('[SocketService] Connecting to', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', this.handleConnect);
    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('connect_error', this.handleConnectError);
    this.socket.on('message:new', this.handleNewMessage);
    this.socket.on('typing:update', this.handleTypingUpdate);
  }

  /**
   * Disconnect from the WebSocket server. Call on logout.
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.messageListeners.clear();
    this.typingListeners.clear();
    this.connectionListeners.clear();
  }

  /**
   * Check if currently connected to the server.
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Join a specific activity's chat room. Required before sending/receiving messages.
   */
  joinActivity(activityId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('activity:join', { activityId });
      console.log('[SocketService] Joined activity:', activityId);
    }
  }

  /**
   * Leave an activity's chat room.
   */
  leaveActivity(activityId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('activity:leave', { activityId });
      console.log('[SocketService] Left activity:', activityId);
    }
  }

  /**
   * Send a new message to an activity's chat.
   */
  sendMessage(activityId: string, text: string): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] Cannot send message: not connected');
      return;
    }
    this.socket.emit('message:send', { activityId, text });
  }

  /**
   * Emit typing indicator for an activity.
   */
  sendTyping(activityId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:status', { activityId, isTyping });
    }
  }

  /**
   * Register a listener for new messages in a specific activity.
   */
  onMessage(activityId: string, listener: MessageListener): () => void {
    if (!this.messageListeners.has(activityId)) {
      this.messageListeners.set(activityId, new Set());
    }
    this.messageListeners.get(activityId)!.add(listener);

    return () => {
      this.messageListeners.get(activityId)?.delete(listener);
    };
  }

  /**
   * Register a listener for typing indicator updates.
   */
  onTyping(activityId: string, listener: TypingListener): () => void {
    if (!this.typingListeners.has(activityId)) {
      this.typingListeners.set(activityId, new Set());
    }
    this.typingListeners.get(activityId)!.add(listener);

    return () => {
      this.typingListeners.get(activityId)?.delete(listener);
    };
  }

  /**
   * Register a listener for connection state changes.
   */
  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  // ─── Event Handlers ────────────────────────────────────────────────────────

  private handleConnect = (): void => {
    console.log('[SocketService] Connected');
    this.reconnectAttempts = 0;
    this.connectionListeners.forEach(listener => listener(true));
  };

  private handleDisconnect = (reason: string): void => {
    console.log('[SocketService] Disconnected:', reason);
    this.connectionListeners.forEach(listener => listener(false));
  };

  private handleConnectError = (error: Error): void => {
    this.reconnectAttempts++;
    console.error(
      `[SocketService] Connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`,
      error.message,
    );

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SocketService] Max reconnection attempts reached');
      this.disconnect();
    }
  };

  private handleNewMessage = (message: ChatMessage): void => {
    const listeners = this.messageListeners.get(message.activityId);
    if (listeners) {
      listeners.forEach(listener => listener(message));
    }
  };

  private handleTypingUpdate = (data: { activityId: string; users: string[] }): void => {
    const listeners = this.typingListeners.get(data.activityId);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  };
}

export const socketService = new SocketService();
