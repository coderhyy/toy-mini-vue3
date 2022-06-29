let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
    }
    run() {
        if (!this.active) {
            return this.fn();
        }
        activeEffect = this;
        console.log("run执行中，this赋值");
        shouldTrack = true;
        const resultValue = this.fn();
        shouldTrack = false;
        return resultValue;
    }
    stop() {
        var _a;
        if (!this.active)
            return;
        cleanupEffect(this);
        (_a = this.onStop) === null || _a === void 0 ? void 0 : _a.call(this);
        this.active = false;
    }
}
function cleanupEffect(effect) {
    const { deps } = effect;
    if (deps.length !== 0) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}
let activeEffect;
const targetMap = new Map();
function isTracking() {
    return activeEffect !== undefined && shouldTrack;
}
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    if (deps.has(activeEffect))
        return;
    console.log("依赖收集");
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const deps = depsMap === null || depsMap === void 0 ? void 0 : depsMap.get(key);
    for (const dep of deps !== null && deps !== void 0 ? deps : []) {
        if (dep.scheduler)
            dep.scheduler();
        else
            dep.run();
    }
}
function effect(fn, option) {
    const _effect = new ReactiveEffect(fn);
    if (option)
        Object.assign(_effect, option);
    _effect.run();
    console.log("run 执行完毕");
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}

function reactive(target) {
    return new Proxy(target, {
        get(target, key) {
            track(target, key);
            return Reflect.get(target, key);
        },
        set(target, key, value) {
            const success = Reflect.set(target, key, value);
            trigger(target, key);
            return success;
        },
    });
}

export { effect, reactive, stop };
//# sourceMappingURL=mini-vue3.esm.js.map
