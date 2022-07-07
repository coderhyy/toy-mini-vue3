export const isObject = (value: unknown) => {
  return value !== null && typeof value === "object";
};

export const isString = (value: unknown) => {
  return typeof value === "string";
};

export const isArray = Array.isArray;

export const hasChanged = (value: unknown, oldValue: unknown) => {
  return !Object.is(value, oldValue);
};

// 类型保护
export const isFunction = (value: unknown): value is Function => {
  return typeof value === "function";
};

export const isOn = (key: string) => /^on[A-Z]/.test(key);
export const hasOwn = (target: Record<string, any>, key: any) =>
  Object.prototype.hasOwnProperty.call(target, key);
