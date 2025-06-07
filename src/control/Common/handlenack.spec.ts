import { handleNack } from "./handleNack";

describe("handleNack", () => {
  it("should call retry if available", async () => {
    const retryMock = jest.fn().mockResolvedValue(undefined);
    const nackMock = jest.fn();

    const control = {
      retry: retryMock,
      nack: nackMock,
    };

    await handleNack(control as any);

    expect(retryMock).toHaveBeenCalled();
    expect(nackMock).not.toHaveBeenCalled();
  });

  it("should call nack if retry is not available", async () => {
    const nackMock = jest.fn().mockResolvedValue(undefined);
    const control = {
      nack: nackMock,
    };

    const error = new Error("Test error");

    await handleNack(control as any, error);

    expect(nackMock).toHaveBeenCalledWith(error);
  });

  it("should call nack with undefined if no error passed", async () => {
    const nackMock = jest.fn().mockResolvedValue(undefined);
    const control = {
      nack: nackMock,
    };

    await handleNack(control as any);

    expect(nackMock).toHaveBeenCalledWith(undefined);
  });
});
