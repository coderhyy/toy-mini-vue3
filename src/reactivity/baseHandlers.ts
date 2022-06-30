import { track, trigger } from "./effect";
export function createReactiveObject<T extends object>(
  target: T,
  handlers: ProxyHandler<T>
) {
  return new Proxy(target, handlers);
}

export function createGetter<T extends object>(isReadonly: boolean = false) {
  return function get(target: T, key: string | symbol) {
    if (!isReadonly) track(target, key as string);
    return Reflect.get(target, key);
  };
}

export function createSetter<T extends object>() {
  return function set(target: T, key: string | symbol, value: unknown) {
    const success = Reflect.set(target, key, value);
    trigger(target, key as string);
    return success;
  };
}
