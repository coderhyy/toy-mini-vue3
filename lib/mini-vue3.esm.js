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
const isString = (value) => {
    return typeof value === "string";
};
const isFunction = (value) => {
    return typeof value === "function";
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const shallowGet = createGetter(false, true);
const shallowSet = createSetter();
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        else if (key === ReactiveFlags.IS_SHALLOW) {
            return isShallow;
        }
        else if (key === ReactiveFlags.RAW) {
            return target;
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

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["IS_SHALLOW"] = "__v_isShallow";
    ReactiveFlags["RAW"] = "__v_raw";
})(ReactiveFlags || (ReactiveFlags = {}));
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
    return !!value[ReactiveFlags.IS_REACTIVE];
}
function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY];
}
function isShallow(value) {
    return !!value[ReactiveFlags.IS_SHALLOW];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function toRaw(observed) {
    const raw = observed && observed[ReactiveFlags.RAW];
    return raw ? toRaw(raw) : observed;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createComponentInstance(vnode) {
    const type = vnode.type;
    const instance = {
        vnode,
        type,
    };
    return instance;
}
function setupComponent(instance) {
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
    finishComponentSetup(instance);
}
function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) ;
    else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (instance)
        instance.render = Component.render;
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    const { props, children } = vnode;
    if (isString(children)) {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    for (const key of Object.getOwnPropertyNames(props).values()) {
        if (Array.isArray(props[key]))
            el.setAttribute(key, props[key].join(" "));
        else
            el.setAttribute(key, props[key]);
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((vnode) => {
        patch(vnode, container);
    });
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    patch(subTree, container);
}

function createApp(rootComponent) {
    const mount = (rootContainer) => {
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
    };
    return {
        mount,
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { ReactiveEffect, ReactiveFlags, createApp, effect, h, isProxy, isReactive, isReadonly, isShallow, isTracking, reactive, readonly, shallowReactive, shallowReadonly, stop, toRaw, track, trackEffect, trigger, triggerEffect };
//# sourceMappingURL=mini-vue3.esm.js.map
