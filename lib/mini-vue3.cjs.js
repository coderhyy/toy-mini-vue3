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
const isString = (value) => {
    return typeof value === "string";
};
const isArray = Array.isArray;
const isFunction = (value) => {
    return typeof value === "function";
};
const isOn = (key) => /^on[A-Z]/.test(key);
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const camelCase = (str) => {
    return str.replace(/-(\w)/g, (_, $1) => {
        return $1.toUpperCase();
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (eventName) => {
    return eventName ? "on" + capitalize(eventName) : "";
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const shallowGet = createGetter(false, true);
const shallowSet = createSetter();
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        if (key === exports.ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === exports.ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        else if (key === exports.ReactiveFlags.IS_SHALLOW) {
            return isShallow;
        }
        else if (key === exports.ReactiveFlags.RAW) {
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

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props: props !== null && props !== void 0 ? props : {},
        children,
        shapeFlag: getShapeFlag(type),
    };
    if (isArray(children)) {
        vnode.shapeFlag |= 16;
    }
    else if (isString(children)) {
        vnode.shapeFlag |= 8;
    }
    normalizeChildren(vnode, children);
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1
        : 4;
}
function normalizeChildren(vnode, children) {
    if (vnode.shapeFlag & 4) {
        if (isObject(children)) {
            vnode.shapeFlag |= 32;
        }
    }
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function emit(instance, event, ...rawArgs) {
    const { props } = instance;
    const eventName = toHandlerKey(camelCase(event));
    const handler = props[eventName];
    handler && handler(...rawArgs);
}

function initProps(instance, rawProps) {
    instance.props = rawProps;
}

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 32) {
        normalizeObjectSlots(instance.slots, children);
    }
}
function normalizeObjectSlots(slots, rawSlots) {
    for (const key in rawSlots) {
        const value = rawSlots[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

const publicPropertiesMap = {
    $slots: (i) => i.slots,
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter)
            return publicGetter(instance);
    },
};

function createComponentInstance(vnode) {
    const type = vnode.type;
    const instance = {
        vnode,
        type,
        render: null,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
    };
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    const { props, children } = instance.vnode;
    initProps(instance, props);
    initSlots(instance, children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
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
    const { type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            {
                if (vnode.shapeFlag & 1) {
                    processElement(vnode, container);
                }
                else if (vnode.shapeFlag & 4) {
                    processComponent(vnode, container);
                }
            }
            break;
    }
}
function processFragment(vnode, container) {
    mountChildren(vnode, container);
}
function processText(vnode, container) {
    mountText(vnode, container);
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
    if (vnode.shapeFlag & 8) {
        el.textContent = children;
    }
    else if (vnode.shapeFlag & 16) {
        mountChildren(vnode, el);
    }
    let val;
    for (const key of Object.getOwnPropertyNames(props).values()) {
        val = props[key];
        if (isArray(val)) {
            el.setAttribute(key, val.join(" "));
        }
        else if (isOn(key) && isFunction(val)) {
            el.addEventListener(key.slice(2).toLowerCase(), val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((vnode) => {
        patch(vnode, container);
    });
}
function mountText(vnode, container) {
    const { children } = vnode;
    const textNode = document.createTextNode(children);
    container.append(textNode);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render.call(instance.proxy);
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

function renderSlot(slots, name = "default", props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
    else {
        return slots;
    }
}

exports.ReactiveEffect = ReactiveEffect;
exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.h = h;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isShallow = isShallow;
exports.isTracking = isTracking;
exports.reactive = reactive;
exports.readonly = readonly;
exports.renderSlot = renderSlot;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.toRaw = toRaw;
exports.track = track;
exports.trackEffect = trackEffect;
exports.trigger = trigger;
exports.triggerEffect = triggerEffect;
//# sourceMappingURL=mini-vue3.cjs.js.map
