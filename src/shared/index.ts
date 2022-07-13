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

// 把 kabobCase => camelCase
export const camelCase = (str: string) => {
  return str.replace(/-(\w)/g, (_, $1: string) => {
    return $1.toUpperCase();
  });
};

// 首字母大写
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// 事件前缀追加 'on'
export const toHandlerKey = (eventName: string) => {
  return eventName ? "on" + capitalize(eventName) : "";
};
