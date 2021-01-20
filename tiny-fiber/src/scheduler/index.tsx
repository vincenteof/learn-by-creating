import { Fiber, FiberRoot, WorkTag, Flags } from '../types'
import { createWIP } from '../fiber'
import beginWork from './beginWork'
import completeWork from './completeWork'

const expireTime = 1
let nextUnitOfWork: Fiber | undefined

export function scheduleWork(fiber: Fiber) {
  const root = getRootFromFiber(fiber)
  requestIdleCallback((dl) => performWork(dl, root))
}

function performWork(dl: IdleDeadline, root: FiberRoot) {
  workLoop(dl, root)
  if (nextUnitOfWork) {
    requestIdleCallback((dl) => performWork(dl, root))
  } else {
    const finishedWork = root.current.alternate
    if (finishedWork) {
      commitRoot(root, finishedWork)
    }
  }
}

function workLoop(dl: IdleDeadline, root: FiberRoot) {
  if (!nextUnitOfWork) {
    nextUnitOfWork = createWIP(root.current, {})
  }
  while (nextUnitOfWork && dl.timeRemaining() > expireTime) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
}

function performUnitOfWork(WIP: Fiber) {
  const current = WIP.alternate
  let next = beginWork(current, WIP)
  WIP.memoizedProps = WIP.pendingProps
  if (!next) {
    next = completeUnitOfWork(WIP)
  }
  return next
}

function completeUnitOfWork(WIP: Fiber) {
  while (true) {
    const current = WIP.alternate
    const returnFiber = WIP.return
    const siblingFiber = WIP.sibling
    if ((WIP.flags & Flags.Incomplete) === Flags.NoFlags) {
      let next = completeWork(current, WIP)
      if (next) {
        return next
      }
      if (
        returnFiber &&
        (returnFiber.flags & Flags.Incomplete) === Flags.NoFlags
      ) {
        if (!returnFiber.firstEffect) {
          returnFiber.firstEffect = WIP.firstEffect
        }
        if (WIP.lastEffect) {
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = WIP.firstEffect
          }
          returnFiber.lastEffect = WIP.lastEffect
        }

        if (WIP.flags > Flags.PerformedWork) {
          if (returnFiber.lastEffect) {
            returnFiber.lastEffect.nextEffect = WIP
          } else {
            returnFiber.firstEffect = WIP
          }
          returnFiber.lastEffect = WIP
        }
      }
    }
    if (siblingFiber) {
      return siblingFiber
    } else if (returnFiber) {
      WIP = returnFiber
      continue
    } else {
      return undefined
    }
  }
}

function commitRoot(root: FiberRoot, finishedWork: Fiber) {}

function getRootFromFiber(fiber: Fiber) {
  let cur = fiber
  while (cur.tag !== WorkTag.HostRoot && cur.return) {
    cur = fiber.return
  }
  return cur.stateNode as FiberRoot
}
