import {
  createReactiveObject,
  mutableHandlers,
  readonlyHandlers,
} from "./baseHandlers";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
}

export function reactive<T extends object>(target: T) {
  return createReactiveObject<T>(target, mutableHandlers);
}

export function readonly<T extends object>(target: T) {
  return createReactiveObject<T>(target, readonlyHandlers);
}

export function isReactive(value: unknown) {
  // 触发proxy的get操作
  return !!(value as Target)[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value: unknown) {
  return !!(value as Target)[ReactiveFlags.IS_READONLY];
}
