import { isFunction, isObject } from "../shared";

// 创建组件实例
export function createComponentInstance(vnode: any) {
  const type = vnode.type;
  const instance = {
    vnode,
    type,
  };

  return instance;
}

export function setupComponent(instance: any) {
  // 初始化props 暂时不实现
  // initProps()
  // 初始化slots 暂时不实现
  // initSlots()
  setupStatefulComponent(instance);
}

// 初始化组件状态
function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }

  finishComponentSetup(instance);
}

function handleSetupResult(instance: any, setupResult: any) {
  if (isFunction(setupResult)) {
    // Todo handle function
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }
}

// 结束组件的安装
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (instance) instance.render = Component.render;
}
