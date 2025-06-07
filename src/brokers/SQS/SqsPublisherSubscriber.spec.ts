import {
  SendMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";
import { SqsPublisherSubscriber } from "./SqsPublisherSubscriber";

describe("SqsPublisherSubscriber", () => {
  let sqsClientMock: jest.Mocked<SQSClient>;
  let publisherSubscriber: SqsPublisherSubscriber;

  beforeEach(() => {
    sqsClientMock = {
      send: jest.fn(),
    } as any;

    publisherSubscriber = new SqsPublisherSubscriber("us-east-1");

    (publisherSubscriber as any).sqsClient = sqsClientMock;
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  describe("publish", () => {
    it("should send a message with the right command and message attributes", async () => {
      sqsClientMock.send = jest.fn().mockResolvedValue({} as SendMessageCommandOutput);

      const options = {
        destination: "https://queue-url",
        headers: { header1: "value1", header2: "value2" },
      };
      const message = { foo: "bar" };

      await publisherSubscriber.publish(options, message);

      expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
      const sentCommand = sqsClientMock.send.mock.calls[0][0] as SendMessageCommand;
      expect(sentCommand).toBeInstanceOf(SendMessageCommand);
      expect(sentCommand.input.QueueUrl).toBe(options.destination);
      expect(sentCommand.input.MessageBody).toBe(JSON.stringify(message));
      expect(sentCommand.input.MessageAttributes).toEqual({
        header1: { DataType: "String", StringValue: "value1" },
        header2: { DataType: "String", StringValue: "value2" },
      });
    });

    it("should send a message without message attributes if none are provided", async () => {
      sqsClientMock.send = jest.fn().mockResolvedValue({} as SendMessageCommandOutput);

      const options = {
        destination: "https://queue-url",
      };
      const message = { foo: "bar" };

      await publisherSubscriber.publish(options, message);

      expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
      const sentCommand = sqsClientMock.send.mock.calls[0][0] as SendMessageCommand;
      expect(sentCommand.input.MessageAttributes).toBeUndefined();
    });
  });

  describe("subscribe", () => {
    it("should poll messages, parse them and call callback with message and control", async () => {
      jest.useFakeTimers();

      const fakeMessages = [
        {
          MessageId: "msg1",
          Body: JSON.stringify({ foo: "bar" }),
          MessageAttributes: {
            attr1: { StringValue: "val1", DataType: "String" },
          },
          ReceiptHandle: "rh1",
        },
        {
          MessageId: "msg2",
          Body: JSON.stringify({ hello: "world" }),
          MessageAttributes: undefined,
          ReceiptHandle: "rh2",
        },
      ];

      // Mock para retornar as mensagens na 1a chamada, vazio na 2a, e erro na 3a para parar o loop
      sqsClientMock.send
        .mockImplementationOnce(async (command) => {
          if (command instanceof ReceiveMessageCommand) {
            return { Messages: fakeMessages };
          }
          return {};
        })
        .mockImplementationOnce(async (command) => {
          if (command instanceof ReceiveMessageCommand) {
            return { Messages: [] };
          }
          return {};
        })
        .mockImplementationOnce(() => {
          throw new Error("stop polling");
        });

      const callbackMock = jest.fn().mockResolvedValue(undefined);

      const subscribePromise = publisherSubscriber.subscribe(
        { destination: "queue-url", pollInterval: 1000 },
        callbackMock
      );

      // 1º polling: processa as 2 mensagens
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // 2º polling: sem mensagens
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // 3º polling: lança erro para parar loop
      jest.advanceTimersByTime(1000);

      await subscribePromise.catch(() => {});

      expect(sqsClientMock.send).toHaveBeenCalledWith(expect.any(ReceiveMessageCommand));

      expect(callbackMock).toHaveBeenCalledTimes(fakeMessages.length);

      expect(callbackMock).toHaveBeenCalledWith(
        {
          id: "msg1",
          payload: { foo: "bar" },
          headers: { attr1: "val1" },
        },
        expect.any(Object) // Instância de MessageControl (SqsMessageControl)
      );

      expect(callbackMock).toHaveBeenCalledWith(
        {
          id: "msg2",
          payload: { hello: "world" },
          headers: {},
        },
        expect.any(Object)
      );

      jest.useRealTimers();
    });
  });
});
