type EffectScheduler = (...args: unknown[]) => unknown;

let shouldTrack = false;

class ReactiveEffect {
  public deps: Set<ReactiveEffect>[] = [];
  public active: boolean = true; // 该effect是否存活
  public onStop?: () => void;

  constructor(public fn: Function, public scheduler?: EffectScheduler) {}
  run() {
    // 如果effect已经杀死了（stop()函数相关）
    if (!this.active) {
      return this.fn();
    }

    activeEffect = this;
    console.log("run执行中，this赋值");

    shouldTrack = true; // 把开关打开让它可以收集依赖
    const resultValue = this.fn();
    shouldTrack = false; // 之后把它关闭,这样就没办法在track函数里面收集依赖了

    return resultValue;
  }
  stop() {
    // 追加active 标识是为了性能优化，避免每次循环重复调用stop同一个依赖的时候
    if (!this.active) return;

    cleanupEffect(this);
    this.onStop?.();
    this.active = false;
  }
}

// 清除指定依赖
function cleanupEffect(effect: ReactiveEffect) {
  // 对effect解构，解出deps，减少对象在词法环境寻找属性的次数
  const { deps } = effect;
  if (deps.length !== 0) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}

// 当前正在执行的effect
let activeEffect: ReactiveEffect;

// 储存依赖的数据结构 { EffectKey: any } : { EffectKey: Set<IDep> }
type EffectKey = string;
type IDep = ReactiveEffect;
const targetMap = new Map<Record<EffectKey, any>, Map<EffectKey, Set<IDep>>>();

function isTracking() {
  return activeEffect !== undefined && shouldTrack;
}

// 添加依赖
export function track(target: Record<EffectKey, any>, key: EffectKey) {
  // 拦截不必要的依赖收集
  if (!isTracking()) return;

  // 寻找dep依赖的执行顺序
  // target -> key -> deps
  let depsMap = targetMap.get(target); // targetMap的key存的只是target的引用
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }

  // 避免不必要的add
  if (deps.has(activeEffect)) return;

  console.log("依赖收集");

  deps.add(activeEffect);
  // activeEffect的deps 接收 Set<ReactiveEffect>类型的deps
  // 供删除依赖的时候使用(停止监听依赖)
  activeEffect.deps.push(deps);
}

// 找出target的key对应的所有依赖，并执行
export function trigger(target: Record<EffectKey, any>, key: EffectKey) {
  const depsMap = targetMap.get(target);
  const deps = depsMap?.get(key);
  for (const dep of deps ?? []) {
    if (dep.scheduler) dep.scheduler();
    else dep.run();
  }
}

interface EffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}

interface EffectOption {
  scheduler?: EffectScheduler;
  onStop?: () => void;
}

// effect会立即触发这个函数，同时响应式追踪其依赖
export function effect<T = any>(
  fn: () => T,
  option?: EffectOption
): EffectRunner {
  const _effect = new ReactiveEffect(fn);

  if (option) Object.assign(_effect, option);

  _effect.run();
  console.log("run 执行完毕");

  const runner = _effect.run.bind(_effect) as EffectRunner;
  runner.effect = _effect;
  return runner;
}

// 删除依赖
export function stop(runner: EffectRunner) {
  runner.effect.stop();
}
