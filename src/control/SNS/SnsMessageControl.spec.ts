import { SnsMessageControl } from "./SnsMessageControl";

describe("SnsMessageControl", () => {
  let snsControl: SnsMessageControl;

  beforeEach(() => {
    snsControl = new SnsMessageControl();
  });

  beforeEach(() => {
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call console.info with correct message on ack", async () => {
    await snsControl.ack();
    expect(console.info).toHaveBeenCalledWith("SNS ack: noop");
  });

  it("should call console.warn with error message on nack with error", async () => {
    const error = new Error("fail");
    await snsControl.nack(error);
    expect(console.warn).toHaveBeenCalledWith("SNS nack: fail");
  });

  it("should call console.warn with 'noop' on nack without error", async () => {
    await snsControl.nack();
    expect(console.warn).toHaveBeenCalledWith("SNS nack: noop");
  });
});
