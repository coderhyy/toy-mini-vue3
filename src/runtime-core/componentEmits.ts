import { camelCase, toHandlerKey } from "../shared";

export function emit(instance: any, event: string, ...rawArgs: unknown[]) {
  const { props } = instance;

  const eventName = toHandlerKey(camelCase(event));

  const handler = props[eventName];
  handler && handler(...rawArgs);
}
