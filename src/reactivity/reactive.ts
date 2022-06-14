import { track, trigger } from "./effect";

export function reactive(target: Record<string, any>) {
  return new Proxy(target, {
    get(target, key) {
      // 收集依赖
      track(target, key as string);
      return Reflect.get(target, key);
    },
    set(target, key, value) {
      const success = Reflect.set(target, key, value);
      // 触发更新依赖
      trigger(target, key as string);
      return success;
    },
  });
}
