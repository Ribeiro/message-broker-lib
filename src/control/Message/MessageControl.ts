export interface MessageControl {
  ack(): Promise<void>;
  nack(error?: Error): Promise<void>;
  retry?(): Promise<void>;
}