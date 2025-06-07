import { KafkaMessageControl } from "./KafkaMessageControl";
import { Consumer } from "kafkajs";

describe("KafkaMessageControl", () => {
  let mockConsumer: jest.Mocked<Consumer>;

  beforeEach(() => {
    mockConsumer = {
      commitOffsets: jest.fn(),
    } as unknown as jest.Mocked<Consumer>;
  });

  it("should call commitOffsets with incremented offset on ack", async () => {
    const control = new KafkaMessageControl(mockConsumer, "test-topic", 0, "10");

    await control.ack();

    expect(mockConsumer.commitOffsets).toHaveBeenCalledWith([
      {
        topic: "test-topic",
        partition: 0,
        offset: "11", // 10 + 1
      },
    ]);
  });

  it("should log a warning on nack without error", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const control = new KafkaMessageControl(mockConsumer, "test-topic", 0, "10");

    await control.nack();

    expect(consoleSpy).toHaveBeenCalledWith("Kafka nack: unknown error");

    consoleSpy.mockRestore();
  });

  it("should log a warning on nack with error", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const control = new KafkaMessageControl(mockConsumer, "test-topic", 0, "10");

    const error = new Error("Test failure");
    await control.nack(error);

    expect(consoleSpy).toHaveBeenCalledWith("Kafka nack: Test failure");

    consoleSpy.mockRestore();
  });
});
