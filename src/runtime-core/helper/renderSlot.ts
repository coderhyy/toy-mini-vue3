import { createVNode, Fragment } from "../vnode";

export function renderSlot(slots: any, name: string = "default", props: any) {
  const slot = slots[name];
  if (slot) {
    if (typeof slot === "function") {
      return createVNode(Fragment, {}, slot(props));
    }
  } else {
    return slots;
  }
}
