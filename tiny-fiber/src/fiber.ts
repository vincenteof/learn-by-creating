import { Fiber, WorkTag, Flags, Element, FiberRoot } from './types'

export function createWIP(current: Fiber, props: Record<string, any>) {
  let WIP = current.alternate
  if (WIP) {
    WIP = createFiber(current.tag, props, current.type, current.key)
    WIP.stateNode = current.stateNode
    WIP.alternate = current
    current.alternate = WIP
  } else {
    WIP.pendingProps = props
  }
  return WIP
}

export function createFiber(
  tag: WorkTag,
  props: Record<string, any>,
  type: Fiber['type'],
  key: Fiber['key']
): Fiber {
  return {
    tag,
    type,
    pendingProps: props,
    memoizedProps: {},
    flags: Flags.NoFlags,
    key,
  }
}

export function createFiberFromElement(element: Element) {
  if (!element) {
    return undefined
  }
  let fiber: Fiber | undefined
  const type = element.type
  if (typeof type === 'string') {
    fiber = createFiber(WorkTag.DOMComponent, element.props, type, element.key)
  } else if (typeof type === 'function') {
    fiber = createFiber(
      WorkTag.FunctionComponent,
      element.props,
      type,
      element.key
    )
  }
  return fiber
}

export function cloneChildFibers(WIP: Fiber) {
  let currentChild = WIP.child
  if (!currentChild) {
    return
  }

  let newChild = createWIP(currentChild, currentChild.pendingProps)
  WIP.child = newChild
  newChild.return = WIP

  while (currentChild.sibling) {
    currentChild = currentChild.sibling
    newChild.sibling = createWIP(currentChild, currentChild.pendingProps)
    newChild = newChild.sibling
    newChild.return = WIP
  }
}

export function getRootFromFiber(fiber: Fiber) {
  let cur = fiber
  while (cur.tag !== WorkTag.HostRoot && cur.return) {
    cur = fiber.return
  }
  return cur.stateNode as FiberRoot
}
