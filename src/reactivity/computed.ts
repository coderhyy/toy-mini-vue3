import { isFunction } from "../shared";
import { ReactiveEffect } from "./effect";

export class ComputedRefImpl<T> {
  private _value: T;
  private _dirty = true;
  private _effect: ReactiveEffect;

  constructor(getter: ComputedGetter<T>, private setter: ComputedSetter<T>) {
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) this._dirty = true;
    });
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }

  set value(newValue: T) {
    this.setter(newValue);
  }
}

type ComputedGetter<T> = (...args: unknown[]) => T;
type ComputedSetter<T> = (v: T) => void;

interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export function computed<T>(option: WritableComputedOptions<T>): any;
export function computed<T>(getter: ComputedGetter<T>): ComputedRefImpl<T>;

export function computed<T>(
  getterOrOption: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;
  if (isFunction(getterOrOption)) {
    getter = getterOrOption;
    setter = () => console.error("错误, 因为是getter只读, 不能赋值");
  } else {
    getter = getterOrOption.get;
    setter = getterOrOption.set;
  }

  return new ComputedRefImpl(getter, setter);
}
