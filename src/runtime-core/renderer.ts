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
    container: any = null,
    parentComponent: any = null,
    anchor: any = null
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
            processElement(n1, n2, container, parentComponent, anchor);
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
    parentComponent: any,
    anchor: any
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
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
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  // c1 是旧节点的子节点数组
  // c2 是新节点的子节点数组
  function patchKeyedChildren(
    c1: any,
    c2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    let i = 0; // 遍历子节点的索引 i = 0
    let l2 = c2.length; // 新子节点长度：l2
    let e1 = c1.length - 1; // 旧子节点的末尾索引：e1
    let e2 = l2 - 1; // 新子节点的末尾索引：e2

    // 比较 n1 与 n2 是否是同一类型的 VNode
    function isSameVNodeType(n1: any, n2: any) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 1.左端对比 新前旧前
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]; // 旧的 vnode 节点
      const n2 = c2[i]; // 新的 vnode 节点

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor);
      } else {
        break;
      }
      i++;
    }

    // 2.右端对比 新后旧后
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 3.新增
    // 当旧子节点被遍历完
    if (i > e1) {
      // 新子节点还有元素未被遍历完
      if (i <= e2) {
        const nextPos = e2 + 1;
        // 确定好锚点元素
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        // 遍历剩余的新子节点
        while (i <= e2) {
          // patch 第一个传 null 表示没有旧节点，直接将新节点插入即可
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      const s1 = i; // 旧子节点的起始索引
      const s2 = i; // 新子节点的起始索引
      const keyToNewIndexMap: Map<string | number, number> = new Map();

      let moved = false;
      let maxNewIndexSoFar = 0;

      // 遍历新子节点
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 需要处理新节点的数量
      const toBePatched = e2 - s2 + 1;
      let patched = 0; // 已 patch 的节点数
      // 初始化 从新的index映射为老的index Map<newIndex, oldIndex>
      // 创建数组的时候给定数组的长度，这个是性能最快的写法
      const newIndexToOldIndexMap = new Array(toBePatched);
      // 初始化为 0 ,后面处理的时候 如果发现是 0 的话，那么说明新值在旧的里面不存在
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

      // 遍历旧子节点
      // 1.需要找出旧节点有，而新节点没有的 -> 需要把这个节点删除掉
      // 2.新旧节点都有的 -> 需要 patch
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 优化点
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue; // continue 用于跳过循环中的一个迭代，并继续执行循环中的下一个迭代。
        }

        let newIndex;
        if (prevChild.key != null) {
          // 这里就可以通过key快速的查找了， 看看在新的里面这个节点存在不存在
          // 时间复杂度O(1)
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 如果没key 的话，那么只能是遍历所有的新节点来确定当前节点存在不存在了
          // 时间复杂度O(n)
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        // 当前节点的 key 不存在于 新子节点中，需要把当前旧节点给删除掉
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        }
        // 新旧节点都存在
        else {
          // 把新节点的索引和旧节点的索引建立映射关系
          // i + 1 是因为 i 有可能是0 (0 的话会被认为新节点在旧的节点中不存在)
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 来确定中间的节点是不是需要移动
          // 新的 newIndex 如果一直升序的话，那么就说明没有移动
          // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
          // 不是升序的话，我们可以确定节点移动过了
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          // 对新旧子节点进行 patch
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          // patch 完毕后，递增 patched 计数
          patched++;
        }
      }

      // 利用最长递增子序列来优化移动逻辑
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];

      let j = increasingNewIndexSequence.length - 1;

      // 遍历新节点
      // 1. 需要找出旧节点没有，而新节点有的 -> 需要把这个节点创建
      // 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]

      // 使用倒叙遍历
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 确定当前要处理的节点索引
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];

        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          // 说明新节点在老的里面不存在
          // 需要创建
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          // 需要移动
          // 1. j 已经没有了 说明剩下的都需要移动了
          // 2. 最长子序列里面的值和当前的值匹配不上，说明当前元素需要移动
          if (j < 0 || increasingNewIndexSequence[j] !== i) {
            // 移动的话使用 insert 即可
            hostInsert(nextChild.el, container, anchor);
          } else {
            // 这里就是命中了  index 和 最长递增子序列的值
            // 所以可以移动指针了
            j--;
          }
        }
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
  function mountElement(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
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

    // 插入
    hostInsert(el, container, anchor);
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

// 最长递增子序列
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
