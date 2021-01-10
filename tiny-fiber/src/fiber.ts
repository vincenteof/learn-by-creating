import { Fiber, WorkTag } from './types'

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

function createFiber(
  tag: WorkTag,
  props: Record<string, any>,
  type: Fiber['type']
): Fiber {
  return {
    tag,
    type,
    pendingProps: props,
  }
}
