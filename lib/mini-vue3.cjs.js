'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
    trackEffect(deps);
}
function trackEffect(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const deps = depsMap === null || depsMap === void 0 ? void 0 : depsMap.get(key);
    if (deps)
        triggerEffect(deps);
}
function triggerEffect(deps) {
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

const isObject = (value) => {
    return value !== null && typeof value === "object";
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const shallowGet = createGetter(false, true);
const shallowSet = createSetter();
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive") {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly") {
            return isReadonly;
        }
        else if (key === "__v_isShallow") {
            return isShallow;
        }
        const res = Reflect.get(target, key);
        if (!isReadonly)
            track(target, key);
        if (isShallow)
            return res;
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const success = Reflect.set(target, key, value);
        trigger(target, key);
        return success;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`${target} do not set ${String(key)} value ${value}, because it is readonly`);
        return true;
    },
};
const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet,
};
function createReactiveObject(target, handlers) {
    return new Proxy(target, handlers);
}

exports.ReactiveFlags = void 0;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["IS_SHALLOW"] = "__v_isShallow";
    ReactiveFlags["RAW"] = "__v_raw";
})(exports.ReactiveFlags || (exports.ReactiveFlags = {}));
function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers);
}
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers);
}
function isReactive(value) {
    return !!value[exports.ReactiveFlags.IS_REACTIVE];
}
function isReadonly(value) {
    return !!value[exports.ReactiveFlags.IS_READONLY];
}
function isShallow(value) {
    return !!value[exports.ReactiveFlags.IS_SHALLOW];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function toRaw(observed) {
    const raw = observed && observed[exports.ReactiveFlags.RAW];
    return raw ? toRaw(raw) : observed;
}

exports.effect = effect;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isShallow = isShallow;
exports.isTracking = isTracking;
exports.reactive = reactive;
exports.readonly = readonly;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.toRaw = toRaw;
exports.track = track;
exports.trackEffect = trackEffect;
exports.trigger = trigger;
exports.triggerEffect = triggerEffect;
//# sourceMappingURL=mini-vue3.cjs.js.map
