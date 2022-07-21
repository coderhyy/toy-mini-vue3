// 通过render把vnode渲染成真实dom

import { isOn, isArray, isFunction } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";
import { Fragment, Text } from "./vnode";

import { createComponentInstance, setupComponent } from "./component";

export function render(vnode: any, container: any) {
  patch(vnode, container, null);
}

function patch(vnode: any, container: any, parentComponent: any) {
  const { type } = vnode;

  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;

    case Text:
      processText(vnode, container);
      break;

    default:
      {
        // 普通元素 处理vnode是普通标签的情况
        if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        }
        // 组件 处理vnode是组件的情况
        else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
      }
      break;
  }
}

function processFragment(vnode: any, container: any, parentComponent: any) {
  mountChildren(vnode, container, parentComponent);
}

function processText(vnode: any, container: any) {
  mountText(vnode, container);
}

function processComponent(vnode: any, container: any, parentComponent: any) {
  mountComponent(vnode, container, parentComponent);
}

function processElement(vnode: any, container: any, parentComponent: any) {
  mountElement(vnode, container, parentComponent);
}

// 挂载 Component
function mountComponent(vnode: any, container: any, parentComponent: any) {
  const instance = createComponentInstance(vnode, parentComponent);

  // 安装组件
  setupComponent(instance);

  setupRenderEffect(instance, container);
}

// 挂载 Element
function mountElement(vnode: any, container: any, parentComponent: any) {
  const el = document.createElement(vnode.type) as HTMLElement;
  const { props, children } = vnode;

  // vnode children 为 string 类型
  if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  }
  // vnode children 为 array 类型
  else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el, parentComponent);
  }

  let val: any;
  // 对 vnode 的 props 进行处理，把虚拟属性添加到 el
  for (const key of Object.getOwnPropertyNames(props).values()) {
    val = props[key];

    // 添加属性(数组)
    if (isArray(val)) {
      el.setAttribute(key, val.join(" "));
    }
    // 添加事件
    else if (isOn(key) && isFunction(val)) {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    }
    // 添加属性
    else {
      el.setAttribute(key, val);
    }
  }

  container.append(el);
}

// 挂载 Element 子节点
function mountChildren(vnode: any, container: any, parentComponent: any) {
  vnode.children.forEach((vnode) => {
    patch(vnode, container, parentComponent);
  });
}

function mountText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = document.createTextNode(children);
  container.append(textNode);
}

function setupRenderEffect(instance: any, container: any) {
  // 获取组件对象 render 返回的 h() 函数生成的 vnode
  const subTree = instance.render.call(instance.proxy);
  // 对组件进行拆箱操作
  patch(subTree, container, instance);
}
