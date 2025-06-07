import { SQSClient } from "@aws-sdk/client-sqs";

export interface SqsControlParams {
  sqsClient: SQSClient;
  queueUrl: string;
  receiptHandle: string;
}