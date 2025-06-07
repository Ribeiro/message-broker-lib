import { MessageControl } from "../Message/MessageControl";

export async function handleNack(control: MessageControl, err?: Error) {
  if (control.retry) {
    await control.retry();
  } else {
    await control.nack(err);
  }
}