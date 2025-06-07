import { Consumer } from "kafkajs";
import { MessageControl } from "../Message/MessageControl";

export class KafkaMessageControl implements MessageControl {
  constructor(
    private readonly consumer: Consumer,
    private readonly topic: string,
    private readonly partition: number,
    private readonly offset: string,
  ) {}

  async ack(): Promise<void> {
    await this.consumer.commitOffsets([
      {
        topic: this.topic,
        partition: this.partition,
        offset: (BigInt(this.offset) + BigInt(1)).toString(),
      },
    ]);
  }

  async nack(error?: Error): Promise<void> {
    console.warn(`Kafka nack: ${error?.message || "unknown error"}`);
  }
}
