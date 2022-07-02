// 创建虚拟 dom 对象
export function createVNode(type: any, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children,
  };
  return vnode;
}
