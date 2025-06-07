import { Consumer, EachMessagePayload, Kafka, Producer } from "kafkajs";
import { BrokerPublishOptions, MessagePublisher } from "../interfaces/publisher/MessagePublisher";
import { BrokerSubscribeOptions, MessageSubscriber, OnMessageReceived } from "../interfaces/subscriber/MessageSubscriber";
import { Message } from "../../contracts/Message";
import { KafkaMessageControl } from "../../control/Kafka/KafkaMessageControl";
import { MessageControl } from "../../control/Message/MessageControl";

export class KafkaPublisherSubscriber
  implements MessagePublisher, MessageSubscriber
{
  private readonly kafka: Kafka;
  private readonly producer: Producer;

  constructor(brokers: string[]) {
    this.kafka = new Kafka({ brokers });
    this.producer = this.kafka.producer();
  }

  async publish<T = any>(
    options: BrokerPublishOptions,
    message: T,
  ): Promise<void> {
    const payload = {
      topic: options.destination,
      messages: [
        {
          key: options.key,
          value: JSON.stringify(message),
          headers: options.headers,
        },
      ],
    };

    await this.producer.connect();
    await this.producer.send(payload);
    await this.producer.disconnect(); // Opcional: mantenha conectado para alto throughput
  }

  async subscribe(
    options: BrokerSubscribeOptions,
    callback: OnMessageReceived,
  ): Promise<void> {
    const consumerGroup = options.consumerGroup || "default-group";
    const consumer: Consumer = this.kafka.consumer({ groupId: consumerGroup });

    await consumer.connect();
    await consumer.subscribe({
      topic: options.destination,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, partition, message } = payload;

        const parsedMessage: Message = {
          id: message.key?.toString() || "",
          payload: message.value ? JSON.parse(message.value.toString()) : null,
          headers: message.headers
            ? Object.fromEntries(
                Object.entries(message.headers).map(([k, v]) => [
                  k,
                  v?.toString() ?? "",
                ]),
              )
            : {},
        };

        const control: MessageControl = new KafkaMessageControl(
          consumer,
          topic,
          partition,
          message.offset,
        );

        try {
          await callback(parsedMessage, control);
        } catch (err) {
          console.error("Kafka message processing error:", err);
        }
      },
    });
  }
}