import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, readonly } from "./reactive";

// 此处调用一次createSetter和getter，为了不在每次使用mutableHandlers的时候重复调用
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

export function createGetter<T extends object>(isReadonly: boolean = false) {
  return function get(target: T, key: string | symbol) {
    if (key === "__v_isReactive") {
      return !isReadonly;
    } else if (key === "__v_isReadonly") {
      return isReadonly;
    }

    const res = Reflect.get(target, key);
    // 实现嵌套对象的 reactive/readonly
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    // 判断是否需要收集依赖
    if (!isReadonly) track(target, key as string);
    return res;
  };
}

export function createSetter<T extends object>() {
  return function set(target: T, key: string | symbol, value: unknown) {
    const success = Reflect.set(target, key, value);
    trigger(target, key as string);
    return success;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(
      `${target} do not set ${String(
        key
      )} value ${value}, because it is readonly`
    );
    return true;
  },
};

export function createReactiveObject<T extends object>(
  target: T,
  handlers: ProxyHandler<T>
) {
  return new Proxy(target, handlers);
}
