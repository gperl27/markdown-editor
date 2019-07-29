export interface Action<
  Type,
  Payload extends {} | ((...params: any) => any) = {}
> {
  type: Type;
  payload?: Payload;
}
