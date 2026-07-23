/**
 * Network Service
 * 
 * Monitors network connectivity and provides hooks for network state awareness.
 * Uses @react-native-community/netinfo for cross-platform connectivity detection.
 */
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';

type NetworkListener = (isConnected: boolean) => void;

class NetworkService {
  private listeners: Set<NetworkListener> = new Set();
  private unsubscribe: NetInfoSubscription | null = null;
  private currentState: boolean = true; // Assume online by default

  /**
   * Initialize the network monitor. Call this once at app startup.
   */
  initialize(): void {
    this.unsubscribe = NetInfo.addEventListener(this.handleConnectivityChange);
  }

  /**
   * Clean up listeners when app unmounts.
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }

  /**
   * Get the current network state synchronously.
   */
  isConnected(): boolean {
    return this.currentState;
  }

  /**
   * Get the current network state asynchronously (more accurate).
   */
  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Register a listener that will be called whenever network state changes.
   */
  addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleConnectivityChange = (state: NetInfoState): void => {
    const isConnected = state.isConnected ?? false;
    
    // Only notify if state actually changed
    if (this.currentState !== isConnected) {
      this.currentState = isConnected;
      this.listeners.forEach(listener => listener(isConnected));
      
      console.log(
        `[NetworkService] Connection ${isConnected ? 'restored' : 'lost'}`,
      );
    }
  };
}

export const networkService = new NetworkService();
