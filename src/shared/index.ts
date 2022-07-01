export const isObject = (value: unknown) => {
  return value !== null && typeof value === "object";
};

export const hasChanged = (value: unknown, oldValue: unknown) => {
  return !Object.is(value, oldValue);
};

// 类型保护
export const isFunction = (value: unknown): value is Function => {
  return typeof value === "function";
};
