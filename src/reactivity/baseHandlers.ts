import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, readonly, ReactiveFlags } from "./reactive";

// 此处调用一次createSetter和getter，为了不在每次使用mutableHandlers的时候重复调用
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

const shallowGet = createGetter(false, true);
const shallowSet = createSetter();

// 高阶函数
export function createGetter<T extends object>(
  isReadonly: boolean = false,
  isShallow: boolean = false
) {
  return function get(target: T, key: string | symbol) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return isShallow;
    } else if (key === ReactiveFlags.RAW) {
      return target;
    }

    const res = Reflect.get(target, key);

    // 判断是否只读
    if (!isReadonly) track(target, key as string);

    if (isShallow) return res;

    // 嵌套对象则递归 reactive/readonly
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

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

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
};

export const readonlyHandlers: ProxyHandler<object> = {
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

export const shallowReadonlyHandlers: ProxyHandler<object> = Object.assign(
  {},
  readonlyHandlers,
  {
    get: shallowReadonlyGet,
  }
);

export const shallowReactiveHandlers: ProxyHandler<object> = {
  get: shallowGet,
  set: shallowSet,
};

export function createReactiveObject<T extends object>(
  target: T,
  handlers: ProxyHandler<T>
) {
  return new Proxy(target, handlers);
}
