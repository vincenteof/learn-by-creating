import { Fiber, WorkTag, EffectFlag } from './types'

export function createWIP(current: Fiber, props: Record<string, any>) {
  let WIP = current.alternate
  if (WIP) {
    WIP = createFiber(current.tag, props, current.type)
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
  type: Fiber['type']
): Fiber {
  return {
    tag,
    type,
    pendingProps: props,
    prevProps: {},
    effectFlag: EffectFlag.NoFlags,
  }
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
