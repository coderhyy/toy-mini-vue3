import { hasChanged, isObject } from "../shared";
import type { Dep } from "./effect";
import { trackEffect, triggerEffect, isTracking } from "./effect";
import { isReactive, reactive } from "./reactive";

export interface Ref<T = any> {
  value: T;
}

class RefImpl<T> {
  private _value: T;
  private _rawValue: T;
  public dep?: Dep = undefined;
  public __v_isRef = true; // 标识是 ref 对象

  constructor(value: any) {
    this._value = convert(value);
    this._rawValue = value;
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue: any) {
    if (hasChanged(this._rawValue, newValue)) {
      this._value = convert(newValue);
      this._rawValue = newValue;
      triggerEffect(this.dep as Dep);
    }
  }
}

function trackRefValue(ref: RefImpl<any>) {
  if (isTracking()) trackEffect(ref.dep as Dep);
}

function convert(value: any) {
  return isObject(value) ? reactive(value) : value;
}

export function ref<T>(value: T): Ref<T> {
  return new RefImpl(value);
}

export function isRef(ref: any) {
  return !!(ref && ref.__v_isRef);
}

export function unref(ref: any) {
  return isRef(ref) ? ref.value : ref;
}

// template解包时用的函数
export function proxyRefs<T extends object>(obj: T) {
  return isReactive(obj)
    ? obj
    : new Proxy(obj, {
        get(target, key) {
          return unref(Reflect.get(target, key));
        },
        set(target, key, value) {
          if (isRef(target[key]) && !isRef(value)) {
            target[key].value = value;
            return true;
          } else {
            return Reflect.set(target, key, value);
          }
        },
      });
}
