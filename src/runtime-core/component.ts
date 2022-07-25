import { shallowReadonly, proxyRefs } from "../reactivity";
import { isFunction, isObject } from "../shared";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { publicInstanceProxyHandlers } from "./componentPublicInstance";

// 创建组件实例
export function createComponentInstance(vnode: any, parentComponent: any) {
  const type = vnode.type;
  const instance = {
    type,
    vnode,
    render: null,
    setupState: {}, // 存储 setup 的返回值
    props: {},
    emit: () => {},
    slots: {}, // 存放插槽的数据
    isMounted: false, // 判断是否已挂载
    provides: parentComponent
      ? parentComponent.provides
      : ({} as Record<string, any>),
    parent: parentComponent, // 父组件的组件实例
  };

  // 赋值 emit
  // 这里使用 bind 把 instance 进行绑定
  // 后面用户使用的时候只需要给 event 和参数即可
  instance.emit = emit.bind(null, instance) as any;

  return instance;
}

export function setupComponent(instance: any) {
  // 取出存在 vnode 里面的 props
  const { props, children } = instance.vnode;

  // 1.处理 props 初始化props
  initProps(instance, props);
  // 2.处理 slots 初始化slots
  initSlots(instance, children);
  setupStatefulComponent(instance);
}

// 初始化组件状态
function setupStatefulComponent(instance: any) {
  // 用户声明的对象就是 instance.type
  // const Component = {setup(),render()} ....
  const Component = instance.type;

  instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);

  // 2.调用setup
  const { setup } = Component;
  if (setup) {
    // currentInstance 设置为 instance
    setCurrentInstance(instance);

    // 真实的处理场景里面应该是只在 dev 环境才会把 props 设置为只读的
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });

    // 3. 处理 setupResult
    handleSetupResult(instance, setupResult);

    // setup() 执行完 置空
    setCurrentInstance(null);
  }

  finishComponentSetup(instance);
}

function handleSetupResult(instance: any, setupResult: any) {
  if (isFunction(setupResult)) {
    // 如果返回的是 function 的话，那么绑定到 render 上
    // 认为是 render 逻辑
    // setup(){ return ()=>(h("div")) }
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    // 如果是个对象的话
    // 用 proxyRefs 解包，方便用户直接访问 ref 类型的值，而不需要在 .value
    instance.setupState = proxyRefs(setupResult);
  }
}

// 结束组件的安装
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (instance) instance.render = Component.render;
}

let currentInstance = null;
export function getCurrentInstance(): any {
  return currentInstance;
}

function setCurrentInstance(instance: any) {
  currentInstance = instance;
}
