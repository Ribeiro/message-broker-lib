import { KafkaControlParams } from "../../brokers/Kafka/KafkaControlParams";
import { SqsControlParams } from "../../brokers/SQS/SqsControlParams";
import { BrokerType } from "./BrokerType";


export type ControlParams =
  | { type: BrokerType.Kafka; params: KafkaControlParams }
  | { type: BrokerType.SQS; params: SqsControlParams }
  | { type: BrokerType.SNS };
  