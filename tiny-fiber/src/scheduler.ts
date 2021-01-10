import { Fiber, FiberRoot, WorkTag } from './types'

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
      completeRoot(root, finishedWork)
    }
  }
}

function workLoop(dl: IdleDeadline, root: FiberRoot) {
  if (!nextUnitOfWork) {
  }
}

function performUnitOfWork(WIP: Fiber) {}

function completeUnitOfWork(WIP: Fiber) {}

function beginWork(current: Fiber | undefined, WIP: Fiber) {}

function completeWork(current: Fiber | undefined, WIP: Fiber) {}

function completeRoot(root: FiberRoot, finishedWork: Fiber) {}

function getRootFromFiber(fiber: Fiber) {
  let cur = fiber
  while (cur.tag !== WorkTag.HostRoot && cur.return) {
    cur = fiber.return
  }
  return cur.stateNode as FiberRoot
}
