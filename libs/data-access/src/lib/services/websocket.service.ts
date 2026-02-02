/**
 * @flyfront/data-access - WebSocket Service
 * @license Apache-2.0
 */

import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { Subject, Observable, timer, EMPTY } from 'rxjs';
import { filter, map, retry, takeUntil, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WebSocketConfig, WebSocketMessage, WebSocketState } from '../models/data-access.models';

/**
 * WebSocket service for real-time communication
 *
 * @example
 * ```typescript
 * // Inject the service
 * private ws = inject(WebSocketService);
 *
 * // Connect to WebSocket
 * this.ws.connect({
 *   url: 'wss://api.example.com/ws',
 *   reconnect: true,
 * });
 *
 * // Subscribe to messages
 * this.ws.messages$
 *   .pipe(filter(msg => msg.type === 'notification'))
 *   .subscribe(msg => console.log(msg.payload));
 *
 * // Send a message
 * this.ws.send({ type: 'subscribe', payload: { channel: 'updates' } });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket$: WebSocketSubject<WebSocketMessage> | null = null;
  private readonly messagesSubject = new Subject<WebSocketMessage>();
  private readonly destroy$ = new Subject<void>();
  private config: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  // Reactive state
  private readonly _state = signal<WebSocketState>('disconnected');
  private readonly _lastMessage = signal<WebSocketMessage | null>(null);
  private readonly _error = signal<Error | null>(null);

  /** Current connection state */
  readonly state = this._state.asReadonly();

  /** Whether the connection is active */
  readonly isConnected = computed(() => this._state() === 'connected');

  /** Last received message */
  readonly lastMessage = this._lastMessage.asReadonly();

  /** Last error */
  readonly error = this._error.asReadonly();

  /** Observable stream of all messages */
  readonly messages$ = this.messagesSubject.asObservable();

  /**
   * Connect to a WebSocket server
   */
  connect(config: WebSocketConfig): void {
    if (this.socket$) {
      this.disconnect();
    }

    this.config = {
      reconnect: true,
      reconnectInterval: 3000,
      reconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };

    this._state.set('connecting');
    this._error.set(null);
    this.reconnectAttempts = 0;

    this.createConnection();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }

    this._state.set('disconnected');
    this.config = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Send a message to the server
   */
  send<T>(message: WebSocketMessage<T>): void {
    if (!this.socket$ || this._state() !== 'connected') {
      console.warn('WebSocket is not connected. Message not sent:', message);
      return;
    }

    const messageWithMeta: WebSocketMessage<T> = {
      ...message,
      timestamp: Date.now(),
      id: message.id ?? this.generateMessageId(),
    };

    this.socket$.next(messageWithMeta as WebSocketMessage);
  }

  /**
   * Subscribe to messages of a specific type
   */
  on<T>(type: string): Observable<T> {
    return this.messages$.pipe(
      filter((msg) => msg.type === type),
      map((msg) => msg.payload as T)
    );
  }

  /**
   * Send a message and wait for a response
   */
  request<TReq, TRes>(
    type: string,
    payload: TReq,
    responseType: string,
    timeout = 30000
  ): Observable<TRes> {
    const id = this.generateMessageId();

    return new Observable<TRes>((subscriber) => {
      const timeoutId = setTimeout(() => {
        subscriber.error(new Error(`WebSocket request timeout: ${type}`));
      }, timeout);

      const subscription = this.messages$
        .pipe(
          filter((msg) => msg.type === responseType && msg.id === id),
          map((msg) => msg.payload as TRes),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (response) => {
            clearTimeout(timeoutId);
            subscriber.next(response);
            subscriber.complete();
          },
          error: (err) => {
            clearTimeout(timeoutId);
            subscriber.error(err);
          },
        });

      this.send({ type, payload, id });

      return () => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  /**
   * Create the WebSocket connection
   */
  private createConnection(): void {
    if (!this.config) return;

    this.socket$ = webSocket<WebSocketMessage>({
      url: this.config.url,
      protocol: this.config.protocols,
      openObserver: {
        next: () => {
          this._state.set('connected');
          this._error.set(null);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
        },
      },
      closeObserver: {
        next: (event) => {
          this._state.set('disconnected');
          this.stopHeartbeat();

          if (this.config?.reconnect && !event.wasClean) {
            this.attemptReconnect();
          }
        },
      },
    });

    this.socket$
      .pipe(
        tap((message) => {
          this._lastMessage.set(message);
          this.messagesSubject.next(message);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => {
          this._error.set(error);
          this._state.set('error');

          if (this.config?.reconnect) {
            this.attemptReconnect();
          }
        },
      });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (!this.config) return;

    const maxAttempts = this.config.reconnectAttempts ?? 10;
    if (this.reconnectAttempts >= maxAttempts) {
      this._error.set(new Error('Max reconnection attempts reached'));
      return;
    }

    this._state.set('reconnecting');
    this.reconnectAttempts++;

    const delay = this.config.reconnectInterval ?? 3000;
    timer(delay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this._state() === 'reconnecting') {
          this.createConnection();
        }
      });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (!this.config?.heartbeatInterval) return;

    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this._state() === 'connected') {
        this.send({ type: 'ping', payload: null });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
