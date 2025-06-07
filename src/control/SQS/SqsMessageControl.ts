import { DeleteMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { MessageControl } from "../Message/MessageControl";

export class SqsMessageControl implements MessageControl {
  constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrl: string,
    private readonly receiptHandle: string,
  ) {}

  async ack(): Promise<void> {
    await this.sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: this.receiptHandle,
      }),
    );
  }

  async nack(error?: Error): Promise<void> {
    console.warn(`SQS nack: ${error?.message || "unknown error"}`);
  }
}