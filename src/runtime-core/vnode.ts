import { isString, isArray, isObject } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";

// fragment用来创建一个碎片组件，这个碎片组件并不会真正的渲染出一个<Fragment></Fragment>
// 他的作用就是渲染slots的时候摆脱div的包裹，让slots直接渲染在父组件上。
export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

// 创建虚拟 dom 对象
export function createVNode(type: any, props?: any, children?: string | any[]) {
  const vnode = {
    el: null,
    key: props?.key,
    type,
    props: props || {},
    children,
    shapeFlag: getShapeFlag(type),
  };

  // 基于 children 再次设置 shapeFlag

  if (isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (isString(children)) {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }

  normalizeChildren(vnode, children);

  return vnode;
}

// 基于 type 来判断是什么类型的组件
function getShapeFlag(type: any) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}

// Todo 暂时主要是为了标识出 slots_children 这个类型来
function normalizeChildren(vnode, children) {
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }
}

export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}
