import { hasChanged, isObject } from "../shared";
import type { Dep } from "./effect";
import { trackEffect, triggerEffect, isTracking } from "./effect";
import { reactive } from "./reactive";

export interface Ref<T = any> {
  value: T;
}

class RefImpl<T> {
  private _value: T;
  private _rawValue: T;
  public dep?: Dep = undefined;

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
