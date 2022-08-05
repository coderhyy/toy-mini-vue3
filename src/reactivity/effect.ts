import { extend } from "../shared";

type EffectScheduler = (...args: unknown[]) => unknown;

// 储存依赖的数据结构 { EffectKey: any } : { EffectKey: Set<IDep> }
type Dep = Set<ReactiveEffect>;
type KeyToDepMap = Map<any, Dep>;
const targetMap = new WeakMap<any, KeyToDepMap>();

// 当前正在执行的effect
let activeEffect: ReactiveEffect | undefined = void 0;
let shouldTrack = false;

export class ReactiveEffect {
  public deps: Dep[] = [];
  public active: boolean = true; // 该effect是否存活
  public onStop?: () => void;

  constructor(public fn: Function, public scheduler?: EffectScheduler) {}
  run() {
    // 执行 fn 但是不收集依赖
    if (!this.active) {
      return this.fn();
    }

    // 执行 fn  收集依赖
    // 可以开始收集依赖了
    shouldTrack = true;

    // 执行的时候给全局的 activeEffect 赋值
    // 利用全局属性来获取当前的 effect
    activeEffect = this;

    const resultValue = this.fn();
    shouldTrack = false; // 之后把它关闭,这样就没办法在track函数里面收集依赖了

    activeEffect = undefined;

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

  deps.forEach((dep) => {
    dep.delete(effect);
  });

  deps.length = 0;
}

interface EffectOption {
  scheduler?: EffectScheduler;
  onStop?: () => void;
}

interface EffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}

// effect会立即触发这个函数，同时响应式追踪其依赖
export function effect<T = any>(
  fn: () => T,
  options?: EffectOption
): EffectRunner {
  const _effect = new ReactiveEffect(fn);

  // 把用户传过来的值合并到 _effect 对象上去
  // 缺点就是不是显式的，看代码的时候并不知道有什么值
  if (options) extend(_effect, options);
  _effect.run();

  // bind() 方法创建一个新的函数, 把 _effect.run 这个方法返回
  // 让用户可以自行选择调用的时机（调用 fn）
  const runner = _effect.run.bind(_effect) as EffectRunner;
  runner.effect = _effect;
  return runner;
}

// 删除依赖
export function stop(runner: EffectRunner) {
  runner.effect.stop();
}

// 添加依赖
export function track(target: Record<string, any>, key: string) {
  // 拦截不必要的依赖收集
  if (!isTracking()) return;

  // 寻找dep依赖的执行顺序
  // target: object -> key -> deps
  let depsMap = targetMap.get(target); // targetMap的key存的只是target的引用
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  trackEffect(dep);
}

// 依赖收集
export function trackEffect(dep: Dep) {
  if (activeEffect && dep.has(activeEffect)) return;
  activeEffect && dep.add(activeEffect);
  activeEffect && activeEffect.deps.push(dep);
}

// 找出target的key对应的所有依赖，并执行
export function trigger(target: Record<string, any>, key: string) {
  const depsMap = targetMap.get(target);
  const deps = depsMap?.get(key);
  if (deps) triggerEffect(deps);
}

// 触发依赖
export function triggerEffect(deps: Dep) {
  for (const dep of deps ?? []) {
    if (dep.scheduler) dep.scheduler();
    else dep.run();
  }
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}
