// 通过render把vnode渲染成真实dom

import { isObject, isString } from "../shared";

import { createComponentInstance, setupComponent } from "./component";

export function render(vnode: any, container: any) {
  patch(vnode, container);
}

function patch(vnode: any, container: any) {
  // 普通元素 处理vnode是普通标签的情况
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  }
  // 组件 处理vnode是组件的情况
  else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

// 挂载 Component
function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);

  // 安装组件
  setupComponent(instance);

  setupRenderEffect(instance, container);
}

// 挂载 Element
function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type) as HTMLElement;
  const { props, children } = vnode;

  if (isString(children)) {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
  }

  for (const key of Object.getOwnPropertyNames(props).values()) {
    if (Array.isArray(props[key])) el.setAttribute(key, props[key].join(" "));
    else el.setAttribute(key, props[key]);
  }

  container.append(el);
}

// 挂载 Element 子节点
function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((vnode) => {
    patch(vnode, container);
  });
}

function setupRenderEffect(instance: any, container: any) {
  // 获取组件返回的 h() 函数
  const subTree = instance.render();
  // 对组件进行拆箱操作
  patch(subTree, container);
}
