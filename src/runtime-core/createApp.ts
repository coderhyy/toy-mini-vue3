import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent: any) {
    const app = {
      mount(rootContainer: any) {
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
      },
    };

    return app;
  };
}
