class ReactiveEffect {
    constructor(fn) {
        this._fn = fn;
    }
    run() {
        console.log(this);
        activeEffect = this;
        this._fn();
    }
}
let activeEffect;
const targetMap = new Map();
function track(target, key) {
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
    deps.add(activeEffect);
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const deps = depsMap === null || depsMap === void 0 ? void 0 : depsMap.get(key);
    for (const dep of deps !== null && deps !== void 0 ? deps : []) {
        dep.run();
    }
}
function effect(fn, options = {}) {
    const _reactiveEffect = new ReactiveEffect(fn);
    _reactiveEffect.run();
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

export { effect, reactive };
//# sourceMappingURL=mini-vue3.esm.js.map
