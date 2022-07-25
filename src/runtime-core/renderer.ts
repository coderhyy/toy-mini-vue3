// 通过render把vnode渲染成真实dom

import { ShapeFlags, EMPTY_OBJ } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { effect } from "../reactivity";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";

interface RendererOptions {
  createElement: (type: string) => any;
  patchProp: (el: any, key: string, preValue: any, nextValue: any) => void;
  insert: (child, parent, anchor?: any) => void;
  remove: (child: HTMLElement) => void;
  setElementText: (el: HTMLElement, text: string) => void;
}

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  const render = (vnode: any, container: any) => {
    patch(null, vnode, container);
  };

  // n1 是旧的 vnode, n2 是新的 vnode
  function patch(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any = null
  ) {
    const { type } = n2;

    switch (type) {
      // 这里有个面试题就是：为什么vue2书写template的时候要一个根元素，而vue3不用根元素？
      // 那是因为有fragment的原因：不再重新生成一个div去包裹template里的元素，而是直接 patch children
      case Fragment:
        processFragment(n2, container, parentComponent);
        break;

      case Text:
        processText(n2, container);
        break;

      default:
        {
          // 普通元素 处理vnode是普通标签的情况
          if (n2.shapeFlag & ShapeFlags.ELEMENT) {
            processElement(n1, n2, container, parentComponent);
          }
          // 组件 处理vnode是组件的情况
          else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            processComponent(n2, container, parentComponent);
          }
        }
        break;
    }
  }

  function processFragment(n2: any, container: any, parentComponent: any) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processText(vnode: any, container: any) {
    mountText(vnode, container);
  }

  function processComponent(vnode: any, container: any, parentComponent: any) {
    mountComponent(vnode, container, parentComponent);
  }

  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;

    // if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    //   if (c2 !== c1) {
    //     console.log("类型为 text_children, 当前需要更新");
    //     hostSetElementText(container, c2 as string);
    //   }
    // }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 卸载旧的子节点
        unmountChildren(container);
      }

      if (c1 !== c2) {
        // 设置元素文本
        hostSetElementText(container, c2);
      }
    } else {
      // text to array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");

        mountChildren(c2, container, parentComponent);
      } else {
        console.log("diff");
      }
    }
  }

  function unmountChildren(child: any) {
    for (let i = 0; i < child.length; i++) {
      hostRemove(child[i]);
    }
  }

  // 对比 props
  function patchProps(el: any, oldProps: any, newProps: any) {
    // 1.更新
    // 之前: oldProps.id = 1 ，更新后：newProps.id = 2
    // 以 newProps 作为基准
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];
      if (prevProp !== nextProp) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }

    // 2. 删除
    // 之前： {id:1,tId:2}  更新后： {id:1}
    // 以 oldProps 作为基准
    // @还需要注意一点，如果这个 key 在 newProps 里面已经存在了，说明已经被处理过了，就不用再处理了
    for (const key in oldProps) {
      const prevProp = oldProps[key];
      const nextProp = null;

      if (!(key in newProps)) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }
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
    const el = (vnode.el = hostCreateElement(vnode.type) as HTMLElement);
    const { props, children } = vnode;

    // vnode children 为 string 类型
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    }
    // vnode children 为 array 类型
    else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent);
    }

    let val: any;
    // 对 vnode 的 props 进行处理，把虚拟属性添加到 el
    for (const key of Object.getOwnPropertyNames(props).values()) {
      val = props[key];

      hostPatchProp(el, key, null, val);
    }

    hostInsert(el, container);
  }

  // 挂载 Element 子节点
  function mountChildren(children: any, container: any, parentComponent: any) {
    children.forEach((VNodeChild) => {
      patch(null, VNodeChild, container, parentComponent);
    });
  }

  function mountText(vnode: any, container: any) {
    const { children } = vnode;
    const textNode = document.createTextNode(children);
    container.append(textNode);
  }

  function setupRenderEffect(instance: any, container: any) {
    effect(() => {
      if (!instance.isMounted) {
        // 获取组件对象 render 返回的 h() 函数生成的 vnode
        const subTree = instance.render.call(instance.proxy);
        instance.subTree = subTree;

        // 对组件进行拆箱操作
        patch(null, subTree, container, instance);

        instance.isMounted = true;
      } else {
        console.log("update");

        // 新的 vnode
        const subTree = instance.render.call(instance.proxy);

        // 旧的 vnode
        const prevSubTree = instance.subTree;

        // 存储这一次的 vnode ，作为下一次更新的旧 vnode
        instance.subTree = subTree;

        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
