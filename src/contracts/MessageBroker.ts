import { MessagePublisher } from "../brokers/interfaces/publisher/MessagePublisher";
import { MessageSubscriber } from "../brokers/interfaces/subscriber/MessageSubscriber";

export interface MessageBroker extends MessagePublisher, MessageSubscriber {}