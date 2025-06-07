import { MessageControlFactory } from "./MessageControlFactory";
import { KafkaMessageControl } from "../Kafka/KafkaMessageControl";
import { SqsMessageControl } from "../SQS/SqsMessageControl";
import { SnsMessageControl } from "../SNS/SnsMessageControl";
import { BrokerType } from "../Common/BrokerType";
import { ControlParams } from "../Common/ControlParams";
import { SQSClient } from "@aws-sdk/client-sqs";

jest.mock("../Kafka/KafkaMessageControl");
jest.mock("../SQS/SqsMessageControl");
jest.mock("../SNS/SnsMessageControl");

type KafkaParams = Extract<ControlParams, { type: BrokerType.Kafka }>;
type SqsParams = Extract<ControlParams, { type: BrokerType.SQS }>;
type SnsParams = Extract<ControlParams, { type: BrokerType.SNS }>;

describe("MessageControlFactory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a KafkaMessageControl when BrokerType is Kafka", () => {
    const mockParams: KafkaParams = {
      type: BrokerType.Kafka,
      params: {
        consumer: {} as any, // mock básico
        topic: "my-topic",
        partition: 1,
        offset: "42",
      },
    };

    const control = MessageControlFactory.createControl(mockParams);

    expect(KafkaMessageControl as unknown as jest.MockedClass<typeof KafkaMessageControl>)
      .toHaveBeenCalledWith(
        mockParams.params.consumer,
        mockParams.params.topic,
        mockParams.params.partition,
        mockParams.params.offset
      );

    expect(control).toBeInstanceOf(KafkaMessageControl);
  });

  it("should create a SqsMessageControl when BrokerType is SQS", () => {
    const mockParams: SqsParams = {
      type: BrokerType.SQS,
      params: {
        sqsClient: {} as unknown as SQSClient,
        queueUrl: "https://example.com/queue",
        receiptHandle: "abc123",
      },
    };

    const control = MessageControlFactory.createControl(mockParams);

    expect(SqsMessageControl as unknown as jest.MockedClass<typeof SqsMessageControl>)
      .toHaveBeenCalledWith(
        mockParams.params.sqsClient,
        mockParams.params.queueUrl,
        mockParams.params.receiptHandle
      );

    expect(control).toBeInstanceOf(SqsMessageControl);
  });

  it("should create a SnsMessageControl when BrokerType is SNS", () => {
    const mockParams: SnsParams = {
      type: BrokerType.SNS,
    };

    const control = MessageControlFactory.createControl(mockParams);

    expect(SnsMessageControl as unknown as jest.MockedClass<typeof SnsMessageControl>)
      .toHaveBeenCalled();

    expect(control).toBeInstanceOf(SnsMessageControl);
  });

  it("should throw an error for an unsupported BrokerType", () => {
    const invalidParams = { type: "InvalidType" } as unknown as ControlParams;

    expect(() => MessageControlFactory.createControl(invalidParams)).toThrow(
      "Unsupported broker type: InvalidType"
    );
  });
});
