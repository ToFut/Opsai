import { ConnectorConfig } from '../types';

export abstract class BaseConnector {
  dispose() {
    throw new Error('Method not implemented.');
  }
  protected config: ConnectorConfig;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  /**
   * Initialize the connector
   */
  abstract initialize(): Promise<void>;

  /**
   * Test the connection
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Execute a request
   */
  abstract executeRequest(endpoint: string, method: string, data?: any): Promise<any>;

  /**
   * Get connector capabilities
   */
  getCapabilities(): string[] {
    return this.config.capabilities;
  }

  /**
   * Get connector version
   */
  getVersion(): string {
    return this.config.version;
  }
} 