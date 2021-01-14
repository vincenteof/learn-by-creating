import { Fiber, WorkTag, FiberRoot } from '../types'
import { cloneChildFibers } from '../fiber'
import { reconcileChildren } from '../reconciler'

function updateRoot(current: Fiber | undefined, WIP: Fiber) {
  const fRoot = WIP.stateNode as FiberRoot
  const nextElement = fRoot.renderer.render()
  reconcileChildren(current, WIP, nextElement)
  return WIP.child
}

function updateDOMComponent(current: Fiber | undefined, WIP: Fiber) {
  return undefined
}

function updateFC(current: Fiber | undefined, WIP: Fiber) {
  return undefined
}

function beginWork(current: Fiber | undefined, WIP: Fiber): Fiber | undefined {
  if (!current) {
    const prevProps = current.prevProps
    const pendingProps = WIP.pendingProps
    if (prevProps === pendingProps) {
      if (WIP.tag === WorkTag.HostRoot) {
        // todo: do something???
      }
      cloneChildFibers(WIP)
      return WIP.child
    }
  }

  if (WIP.tag === WorkTag.HostRoot) {
    return updateRoot(current, WIP)
  } else if (WIP.tag === WorkTag.DOMComponent) {
    return updateDOMComponent(current, WIP)
  } else if (WIP.tag === WorkTag.FunctionComponent) {
    return updateFC(current, WIP)
  }
  return
}

export default beginWork
