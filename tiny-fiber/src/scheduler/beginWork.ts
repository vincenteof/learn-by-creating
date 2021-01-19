import { Fiber, WorkTag, FiberRoot } from '../types'
import { cloneChildFibers } from '../fiber'
import { reconcileChildren } from '../reconciler'
import { prepareHooks, finishHooks } from './hooks'

function updateRoot(current: Fiber | undefined, WIP: Fiber) {
  const fRoot = WIP.stateNode as FiberRoot
  const nextElement = fRoot.renderer.render()
  reconcileChildren(current, WIP, nextElement)
  return WIP.child
}

function updateDOMComponent(current: Fiber | undefined, WIP: Fiber) {
  const pendingProps = WIP.pendingProps
  let nextChildren = pendingProps.children
  reconcileChildren(current, WIP, nextChildren)
  return WIP.child
}

function updateFC(current: Fiber | undefined, WIP: Fiber) {
  const Component = WIP.type as Function
  const pendingProps = WIP.pendingProps
  prepareHooks(current, WIP)
  const nextChildren = Component(pendingProps)
  finishHooks()
  reconcileChildren(current, WIP, nextChildren)
  return WIP.child
}

function beginWork(current: Fiber | undefined, WIP: Fiber): Fiber | undefined {
  if (!current) {
    const memoizedProps = current.memoizedProps
    const pendingProps = WIP.pendingProps
    if (memoizedProps === pendingProps) {
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
