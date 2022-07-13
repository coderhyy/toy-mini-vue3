import { isArray } from "../shared";
import { ShapeFlags } from "../shared/shapeFlags";

export function initSlots(instance: any, children: any) {
  const { vnode } = instance;

  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(instance.slots, children);
  }
}

function normalizeObjectSlots(slots: any, rawSlots: any) {
  for (const key in rawSlots) {
    const value = rawSlots[key];
    slots[key] = (props: any) => normalizeSlotValue(value(props));
  }
}

// 转数组
function normalizeSlotValue(value: any) {
  return isArray(value) ? value : [value];
}
