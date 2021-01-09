import { Fiber, FiberRoot } from './types'

let nextUnitOfWork: undefined | Fiber

export function scheduleWork(fiber: Fiber) {}

function performWork(dl: IdleDeadline, root: FiberRoot) {}

function workLoop(dl: IdleDeadline, root: FiberRoot) {}

function performUnitOfWork(WIP: Fiber) {}

function completeUnitOfWork(WIP: Fiber) {}
