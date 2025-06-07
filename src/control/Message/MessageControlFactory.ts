import { BrokerType } from "../Common/BrokerType";
import { ControlParams } from "../Common/ControlParams";
import { KafkaMessageControl } from "../Kafka/KafkaMessageControl";
import { MessageControl } from "./MessageControl";
import { SnsMessageControl } from "../SNS/SnsMessageControl";
import { SqsMessageControl } from "../SQS/SqsMessageControl";

export class MessageControlFactory {
  static createControl(config: ControlParams): MessageControl {
    switch (config.type) {
      case BrokerType.Kafka:
        return new KafkaMessageControl(
          config.params.consumer,
          config.params.topic,
          config.params.partition,
          config.params.offset,
        );
      case BrokerType.SQS:
        return new SqsMessageControl(
          config.params.sqsClient,
          config.params.queueUrl,
          config.params.receiptHandle,
        );
      case BrokerType.SNS:
        return new SnsMessageControl();
      default:
        throw new Error(`Unsupported broker type: ${(config as any).type}`);
    }
  }
}