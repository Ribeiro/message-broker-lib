import { MessageControl } from "../Message/MessageControl";

export class SnsMessageControl implements MessageControl {
  async ack(): Promise<void> {
    console.info("SNS ack: noop");
  }

  async nack(error?: Error): Promise<void> {
    console.warn(`SNS nack: ${error?.message || "noop"}`);
  }
}