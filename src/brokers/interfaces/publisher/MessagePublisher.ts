export interface BrokerPublishOptions {
  destination: string;
  headers?: Record<string, string>;
  key?: string;
  [key: string]: any;
}

export interface MessagePublisher {
  publish<T = any>(options: BrokerPublishOptions, message: T): Promise<void>;
}