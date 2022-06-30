import {
  createReactiveObject,
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
  shallowReactiveHandlers,
} from "./baseHandlers";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  IS_SHALLOW = "__v_isShallow",
  RAW = "__v_raw",
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.IS_SHALLOW]?: boolean;
  [ReactiveFlags.RAW]?: any;
}

export function reactive<T extends object>(target: T) {
  return createReactiveObject<T>(target, mutableHandlers);
}

export function readonly<T extends object>(target: T) {
  return createReactiveObject<T>(target, readonlyHandlers);
}

export function shallowReadonly<T extends object>(target: T) {
  return createReactiveObject<T>(target, shallowReadonlyHandlers);
}

export function shallowReactive<T extends object>(target: T) {
  return createReactiveObject<T>(target, shallowReactiveHandlers);
}

export function isReactive(value: unknown) {
  // 触发proxy的get操作
  return !!(value as Target)[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value: unknown) {
  return !!(value as Target)[ReactiveFlags.IS_READONLY];
}

export function isShallow(value: unknown) {
  return !!(value as Target)[ReactiveFlags.IS_SHALLOW];
}

export function isProxy(value: unknown) {
  return isReactive(value) || isReadonly(value);
}

export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as Target)[ReactiveFlags.RAW];
  return raw ? toRaw(raw) : observed;
}
