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

// 实现effect的scheduler功能
// 该功能描述：
// 1. effect首次执行的时候不执行scheduler,直接执行回调函数
// 2. 之后每次触发trigger函数的时候都会执行scheduler函数，不执行effect回调函数
// 3. 当调用run的时候才会触发runner，也就是说调用effect的回调函数
it("scheduler", () => {
  let dummy;
  let run: any;
  const scheduler = jest.fn(() => {
    run = runner;
  });
  const obj = reactive({ foo: 1 });
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    { scheduler }
  );
  expect(scheduler).not.toHaveBeenCalled();
  expect(dummy).toBe(1);
  // should be called on first trigger set操作的时候,也就是说在trigger被调用的时候
  obj.foo++;
  expect(scheduler).toHaveBeenCalledTimes(1);
  // should not run yet
  expect(dummy).toBe(1);
  // manually run  会触发effect的回调函数
  run();
  // should have run
  expect(dummy).toBe(2);
});
