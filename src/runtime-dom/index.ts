import { isOn, isFunction } from "../shared";
import { createRenderer } from "../runtime-core";

// 创建元素
function createElement(type: string) {
  return document.createElement(type);
}

function createText(text: string) {
  return document.createTextNode(text);
}

function setText(node, text) {
  node.nodeValue = text;
}

// 设置元素文本
function setElementText(el: HTMLElement, text: string) {
  el.textContent = text;
}

// 更新 props
function patchProp(el, key: string, preValue, nextValue) {
  // if (isOn(key)) {
  //   const invokers = el._vei || (el._vei = {});
  //   const existingInvoker = invokers[key];

  //   if (invokers && existingInvoker) {
  //     existingInvoker.value = nextValue;
  //   } else {
  //     const eventName = key.slice(2).toLowerCase();

  //     if (nextValue) {
  //       const invoker = (invokers[key] = nextValue);
  //       el.addEventListener(eventName, invoker);
  //     } else {
  //       el.removeEventListener(eventName, existingInvoker);
  //       invokers[key] = undefined;
  //     }
  //   }
  // }
  if (Array.isArray(nextValue)) {
    el.setAttribute(key, nextValue.join(" "));
  } else if (isOn(key) && isFunction(nextValue)) {
    // 添加事件
    el.addEventListener(key.slice(2).toLowerCase(), nextValue);
  } else {
    if (nextValue === null || nextValue === "") {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }
}

// 插入元素 anchor 锚点，插入哪一个位置之前，如果是 null 则默认插入到最后
function insert(child, parent, anchor = null) {
  parent.insertBefore(child, anchor);
}

// 删除元素
function remove(child: HTMLElement) {
  const parent = child.parentNode;
  if (parent) parent.removeChild(child);
}

let renderer;

function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer({
      createElement,
      patchProp,
      insert,
      remove,
      setElementText,
    }))
  );
}

export const createApp = (...args: any[]) => {
  return ensureRenderer().createApp(...args);
};

export * from "../runtime-core";
