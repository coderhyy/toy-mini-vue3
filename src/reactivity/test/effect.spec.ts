import { effect, reactive } from "../index";
describe("effect test", () => {
  it("effect", () => {
    // 创建proxy代理
    let count = reactive({ num: 11 });
    let result = 0;
    // 立即执行effect并跟踪依赖
    effect(() => {
      // count.num触发get 存储依赖
      result = count.num + 1;
    });
    expect(result).toBe(12);
    // 这里会先触发proxy的get操作再触发proxy的set操作，触发依赖trigger 更新result
    count.num++;
    expect(result).toBe(13);
  });
});

// 实现effect返回runner函数 这个runner函数其实就是effect的回调函数
it("should return runner when effect was called", () => {
  let foo = 1;
  let runner = effect(() => {
    foo++;
    return "foo";
  });
  expect(foo).toBe(2);
  let returnValue = runner();
  expect(foo).toBe(3);
  expect(returnValue).toBe("foo");
});
