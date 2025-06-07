import {
    MessageAttributeValue,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import {
  BrokerPublishOptions,
  MessagePublisher,
} from "../interfaces/publisher/MessagePublisher";
import {
  BrokerSubscribeOptions,
  MessageSubscriber,
  OnMessageReceived,
} from "../interfaces/subscriber/MessageSubscriber";
import { Message } from "../../contracts/Message";
import { MessageControl } from "../../control/Message/MessageControl";
import { SqsMessageControl } from "../../control/SQS/SqsMessageControl";

export class SqsPublisherSubscriber
  implements MessagePublisher, MessageSubscriber
{
  private readonly sqsClient: SQSClient;

  constructor(region: string) {
    this.sqsClient = new SQSClient({ region });
  }

  async publish<T = any>(
    options: BrokerPublishOptions,
    message: T
  ): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: options.destination,
      MessageBody: JSON.stringify(message),
      MessageAttributes: options.headers
        ? Object.entries(options.headers).reduce((acc, [key, value]) => {
            acc[key] = {
              DataType: "String",
              StringValue: value,
            };
            return acc;
          }, {} as any)
        : undefined,
    });

    await this.sqsClient.send(command);
  }

  async subscribe(
    options: BrokerSubscribeOptions,
    callback: OnMessageReceived
  ): Promise<void> {
    const queueUrl = options.destination;
    const pollInterval = options.pollInterval || 5000;

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const parseMessage = (rawMessage: any): Message => ({
      id: rawMessage.MessageId ?? "",
      payload: rawMessage.Body ? JSON.parse(rawMessage.Body) : null,
      headers: rawMessage.MessageAttributes
        ? Object.fromEntries(
            Object.entries(rawMessage.MessageAttributes).map(([k, v]) => [
              k,
              (v as MessageAttributeValue).StringValue ?? "",
            ])
          )
        : {},
    });

    const processMessages = async (messages: any[]) => {
      for (const rawMessage of messages) {
        const parsedMessage = parseMessage(rawMessage);
        const control: MessageControl = new SqsMessageControl(
          this.sqsClient,
          queueUrl,
          rawMessage.ReceiptHandle || ""
        );

        try {
          await callback(parsedMessage, control);
        } catch (err) {
          console.error("SQS message processing error:", err);
        }
      }
    };

    const poll = async () => {
      while (true) {
        const result = await this.sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
            MessageAttributeNames: ["All"],
          })
        );

        if (result.Messages) {
          await processMessages(result.Messages);
        }

        await sleep(pollInterval);
      }
    };

    poll().catch((err) => {
      console.error("Polling failed:", err);
    });
  }
}
