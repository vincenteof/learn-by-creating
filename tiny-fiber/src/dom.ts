import { Element, FiberRoot, WorkTag, RootRenderer } from './types'
import { createFiber } from './fiber'
import { scheduleWork } from './scheduler'

class Renderer implements RootRenderer {
  private el: Element

  constructor(el: Element) {
    this.el = el
  }

  injectElement(el: Element) {
    this.el = el
  }

  render() {
    return this.el
  }
}

export function render(el: Element, container: Node & { _fRoot?: FiberRoot }) {
  const _fRoot = container._fRoot
  if (!_fRoot) {
    container._fRoot = {
      containerInfo: container,
      current: createFiber(WorkTag.HostRoot, el.props, el.type, el.key),
      renderer: new Renderer(el),
    }
  } else {
    _fRoot.renderer.injectElement(el)
  }
  scheduleWork(_fRoot.current)
}
