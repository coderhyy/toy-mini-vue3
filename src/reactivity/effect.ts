type EffectScheduler = (...args: unknown[]) => unknown;

class ReactiveEffect {
  public deps: Set<ReactiveEffect>[] = [];
  private _fn: Function;
  constructor(public fn: Function, public scheduler?: EffectScheduler) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    const resultValue = this._fn();
    return resultValue;
  }
}

// 当前正在执行的effect
let activeEffect: ReactiveEffect;

// 储存依赖的数据结构 {key: vlaue} : {key: [dep1, dep2]}
type EffectKey = string;
type IDep = ReactiveEffect;
const targetMap = new Map<Record<EffectKey, any>, Map<EffectKey, Set<IDep>>>();

// 添加依赖
export function track(target: Record<EffectKey, any>, key: EffectKey) {
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

  deps.add(activeEffect);
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

interface EffectOption {
  scheduler?: EffectScheduler;
  onStop?: () => void;
}

// effect会立即触发这个函数，同时响应式追踪其依赖
export function effect<T = any>(fn: () => T, option?: EffectOption) {
  const _effect = new ReactiveEffect(fn);

  if (option) Object.assign(_effect, option);

  _effect.run();

  const runner = _effect.run.bind(_effect);
  return runner;
}
