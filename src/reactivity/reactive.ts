import {
  createReactiveObject,
  createGetter,
  createSetter,
} from "./baseHandlers";

export const mutableHandlers: ProxyHandler<object> = {
  get: createGetter(),
  set: createSetter(),
};

export const readonlyHandlers: ProxyHandler<object> = {
  get: createGetter(true),
  set: function (target, key, value) {
    console.warn(
      `${target} do not set ${String(
        key
      )} value ${value}, because it is readonly`
    );
    return true;
  },
};

export function reactive<T extends object>(target: T) {
  return createReactiveObject<T>(target, mutableHandlers);
}

export function readonly<T extends object>(target: T) {
  return createReactiveObject<T>(target, readonlyHandlers);
}
