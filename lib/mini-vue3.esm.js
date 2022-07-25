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
const hasChanged = (value, oldValue) => {
    return !Object.is(value, oldValue);
};
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

class RefImpl {
    constructor(value) {
        this.dep = undefined;
        this.__v_isRef = true;
        this._value = convert(value);
        this._rawValue = value;
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(this._rawValue, newValue)) {
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerEffect(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking())
        trackEffect(ref.dep);
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!(ref && ref.__v_isRef);
}
function unref(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(obj) {
    return isReactive(obj)
        ? obj
        : new Proxy(obj, {
            get(target, key) {
                return unref(Reflect.get(target, key));
            },
            set(target, key, value) {
                if (isRef(target[key]) && !isRef(value)) {
                    target[key].value = value;
                    return true;
                }
                else {
                    return Reflect.set(target, key, value);
                }
            },
        });
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        el: null,
        type,
        props: props || {},
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

function h(type, props, children) {
    return createVNode(type, props, children);
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

function createComponentInstance(vnode, parentComponent) {
    const type = vnode.type;
    const instance = {
        type,
        vnode,
        render: null,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        isMounted: false,
        provides: parentComponent
            ? parentComponent.provides
            : {},
        parent: parentComponent,
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
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        handleSetupResult(instance, setupResult);
        setCurrentInstance(null);
    }
    finishComponentSetup(instance);
}
function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) {
        instance.render = setupResult;
    }
    else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
    }
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (instance)
        instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
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

var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOTS_CHILDREN"] = 32] = "SLOTS_CHILDREN";
})(ShapeFlags || (ShapeFlags = {}));
const EMPTY_OBJ = {};

function createAppAPI(render) {
    return function createApp(rootComponent) {
        const app = {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
        return app;
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    const render = (vnode, container) => {
        patch(null, vnode, container);
    };
    function patch(n1, n2, container, parentComponent = null) {
        const { type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n2, container, parentComponent);
                break;
            case Text:
                processText(n2, container);
                break;
            default:
                {
                    if (n2.shapeFlag & 1) {
                        processElement(n1, n2, container, parentComponent);
                    }
                    else if (n2.shapeFlag & 4) {
                        processComponent(n2, container, parentComponent);
                    }
                }
                break;
        }
    }
    function processFragment(n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processText(vnode, container) {
        mountText(vnode, container);
    }
    function processComponent(vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        if (shapeFlag & 8) {
            if (prevShapeFlag & 16) {
                unmountChildren(container);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 8) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent);
            }
            else {
                console.log("diff");
            }
        }
    }
    function unmountChildren(child) {
        for (let i = 0; i < child.length; i++) {
            hostRemove(child[i]);
        }
    }
    function patchProps(el, oldProps, newProps) {
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        for (const key in oldProps) {
            const prevProp = oldProps[key];
            const nextProp = null;
            if (!(key in newProps)) {
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, container);
    }
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { props, children } = vnode;
        if (vnode.shapeFlag & 8) {
            el.textContent = children;
        }
        else if (vnode.shapeFlag & 16) {
            mountChildren(vnode.children, el, parentComponent);
        }
        let val;
        for (const key of Object.getOwnPropertyNames(props).values()) {
            val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((VNodeChild) => {
            patch(null, VNodeChild, container, parentComponent);
        });
    }
    function mountText(vnode, container) {
        const { children } = vnode;
        const textNode = document.createTextNode(children);
        container.append(textNode);
    }
    function setupRenderEffect(instance, container) {
        effect(() => {
            if (!instance.isMounted) {
                const subTree = instance.render.call(instance.proxy);
                instance.subTree = subTree;
                patch(null, subTree, container, instance);
                instance.isMounted = true;
            }
            else {
                console.log("update");
                const subTree = instance.render.call(instance.proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function setElementText(el, text) {
    el.textContent = text;
}
function patchProp(el, key, preValue, nextValue) {
    if (Array.isArray(nextValue)) {
        el.setAttribute(key, nextValue.join(" "));
    }
    else if (isOn(key) && isFunction(nextValue)) {
        el.addEventListener(key.slice(2).toLowerCase(), nextValue);
    }
    else {
        if (nextValue === null || nextValue === "") {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent)
        parent.removeChild(child);
}
let renderer;
function ensureRenderer() {
    return (renderer ||
        (renderer = createRenderer({
            createElement,
            patchProp,
            insert,
            remove,
            setElementText,
        })));
}
const createApp = (...args) => {
    return ensureRenderer().createApp(...args);
};

export { ReactiveEffect, ReactiveFlags, createApp, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, isShallow, isTracking, provide, proxyRefs, reactive, readonly, ref, renderSlot, shallowReactive, shallowReadonly, stop, toRaw, track, trackEffect, trigger, triggerEffect, unref };
//# sourceMappingURL=mini-vue3.esm.js.map
