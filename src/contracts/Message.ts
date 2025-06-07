export interface Message {
  id: string;
  payload: any;
  headers: Record<string, string>;
}
