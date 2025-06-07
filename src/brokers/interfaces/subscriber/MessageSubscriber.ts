import { Message } from "../../../contracts/Message";
import { MessageControl } from "../../../control/Message/MessageControl";

export type OnMessageReceived = (
  message: Message,
  control: MessageControl,
) => Promise<void>;

export interface BrokerSubscribeOptions {
  destination: string;
  consumerGroup?: string;
  durable?: boolean;
  [key: string]: any;
}

export interface MessageSubscriber {
  subscribe(
    options: BrokerSubscribeOptions,
    callback: OnMessageReceived,
  ): Promise<void>;
}