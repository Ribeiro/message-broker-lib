import { SqsMessageControl } from "./SqsMessageControl";
import { SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";

describe("SqsMessageControl", () => {
  let sqsClientMock: SQSClient & { send: jest.Mock };
  let sqsControl: SqsMessageControl;

  const queueUrl = "https://example.com/queue";
  const receiptHandle = "abc123";

  beforeEach(() => {
    sqsClientMock = {
      send: jest.fn(), // mock explícito do método send
    } as unknown as SQSClient & { send: jest.Mock };

    sqsControl = new SqsMessageControl(sqsClientMock, queueUrl, receiptHandle);

    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call sqsClient.send with DeleteMessageCommand on ack", async () => {
    sqsClientMock.send.mockResolvedValue({}); // sem erro de tipagem

    await sqsControl.ack();

    expect(sqsClientMock.send).toHaveBeenCalledTimes(1);

    const command = sqsClientMock.send.mock.calls[0][0];
    expect(command).toBeInstanceOf(DeleteMessageCommand);
    expect(command.input).toEqual({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });
  });

  it("should call console.warn with error message on nack with error", async () => {
    const error = new Error("fail");
    await sqsControl.nack(error);

    expect(console.warn).toHaveBeenCalledWith("SQS nack: fail");
  });

  it("should call console.warn with 'unknown error' on nack without error", async () => {
    await sqsControl.nack();

    expect(console.warn).toHaveBeenCalledWith("SQS nack: unknown error");
  });
});
