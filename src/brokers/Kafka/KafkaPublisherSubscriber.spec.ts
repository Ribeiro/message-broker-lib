import { KafkaPublisherSubscriber } from "./KafkaPublisherSubscriber";
import {
  Kafka,
  Producer,
  Consumer,
  EachMessagePayload,
  KafkaMessage,
} from "kafkajs";
import { KafkaMessageControl } from "../../control/Kafka/KafkaMessageControl";
import { Buffer } from "buffer";

jest.mock("kafkajs");
jest.mock("../../control/Kafka/KafkaMessageControl");

describe("KafkaPublisherSubscriber", () => {
  let kafkaMock: jest.Mocked<Kafka>;
  let producerMock: jest.Mocked<Producer>;
  let consumerMock: jest.Mocked<Consumer>;
  let instance: KafkaPublisherSubscriber;

  beforeEach(() => {
    jest.clearAllMocks();

    producerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;

    consumerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockImplementation(async ({ eachMessage }) => {
        const message: KafkaMessage = {
          key: Buffer.from("key1"),
          value: Buffer.from(JSON.stringify({ foo: "bar" })),
          headers: { header1: Buffer.from("value1") },
          offset: "5",
          timestamp: Date.now().toString(),
          attributes: 0,
        };
        const payload: EachMessagePayload = {
          topic: "test-topic",
          partition: 0,
          message,
          heartbeat: async () => {},
          pause: (): (() => void) => {
            return () => {
              // Optionally do something here or leave empty
            };
          },
        };
        await eachMessage(payload);
      }),
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;

    kafkaMock = {
      producer: jest.fn().mockReturnValue(producerMock),
      consumer: jest.fn().mockReturnValue(consumerMock),
    } as any;

    (Kafka as jest.Mock).mockImplementation(() => kafkaMock);

    instance = new KafkaPublisherSubscriber(["broker1:9092"]);
  });

  describe("publish", () => {
    it("should connect, send message and disconnect producer", async () => {
      const options = {
        destination: "my-topic",
        key: "key123",
        headers: { some: "header" },
      };

      const message = { foo: "bar" };

      await instance.publish(options, message);

      expect(producerMock.connect).toHaveBeenCalled();
      expect(producerMock.send).toHaveBeenCalledWith({
        topic: "my-topic",
        messages: [
          {
            key: "key123",
            value: JSON.stringify(message),
            headers: { some: "header" },
          },
        ],
      });
      expect(producerMock.disconnect).toHaveBeenCalled();
    });
  });

  describe("subscribe", () => {
    it("should connect consumer, subscribe to topic and run consumer with eachMessage", async () => {
      const options = { destination: "test-topic", consumerGroup: "my-group" };
      const callback = jest.fn().mockResolvedValue(undefined);

      (KafkaMessageControl as jest.Mock).mockImplementation(() => ({
        ack: jest.fn(),
        nack: jest.fn(),
        retry: undefined,
      }));

      await instance.subscribe(options, callback);

      expect(kafkaMock.consumer).toHaveBeenCalledWith({ groupId: "my-group" });
      expect(consumerMock.connect).toHaveBeenCalled();
      expect(consumerMock.subscribe).toHaveBeenCalledWith({
        topic: "test-topic",
        fromBeginning: false,
      });
      expect(consumerMock.run).toHaveBeenCalled();

      expect(callback).toHaveBeenCalledWith(
        {
          id: "key1",
          payload: { foo: "bar" },
          headers: { header1: "value1" },
        },
        expect.any(Object)
      );

      expect(KafkaMessageControl).toHaveBeenCalledWith(
        consumerMock,
        "test-topic",
        0,
        "5"
      );
    });

    it("should log error if callback throws", async () => {
      const options = { destination: "test-topic" };
      const error = new Error("fail");
      const callback = jest.fn().mockRejectedValue(error);

      jest.spyOn(console, "error").mockImplementation(() => {});

      await instance.subscribe(options, callback);

      expect(console.error).toHaveBeenCalledWith(
        "Kafka message processing error:",
        error
      );

      jest.restoreAllMocks();
    });
  });
});
