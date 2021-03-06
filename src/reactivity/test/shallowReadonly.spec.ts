import { shallowReadonly, isReadonly, isReactive } from "../reactive";

it("shallowReadonly basic test", () => {
  let original = {
    foo: {
      name: "hyy",
    },
  };
  let obj = shallowReadonly(original);
  expect(isReadonly(obj)).toBe(true);
  // 因为只做表层的readonly，深层的数据还不是proxy
  expect(isReadonly(obj.foo)).toBe(false);
  expect(isReactive(obj.foo)).toBe(false);
});
