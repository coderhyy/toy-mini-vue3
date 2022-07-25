export const enum ShapeFlags {
  ELEMENT = 1, // 最后要渲染的 element 类型

  STATEFUL_COMPONENT = 1 << 2, // 组件类型

  TEXT_CHILDREN = 1 << 3, // vnode 的 children 为 string 类型

  ARRAY_CHILDREN = 1 << 4, // vnode 的 children 为数组类型

  SLOTS_CHILDREN = 1 << 5, // vnode 的 children 为 slots 类型
}

export const EMPTY_OBJ = {};
