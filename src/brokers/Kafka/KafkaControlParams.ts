import { Consumer } from 'kafkajs';

export interface KafkaControlParams {
  consumer: Consumer;
  topic: string;
  partition: number;
  offset: string;
}
  