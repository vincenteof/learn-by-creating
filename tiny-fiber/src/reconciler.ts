import { Fiber, Element } from './types'

class ChildReconciler {
  shouldTrackSideEffects: boolean

  constructor(shouldTrackSideEffects: boolean) {
    this.shouldTrackSideEffects = shouldTrackSideEffects
  }

  placeSingleChild(fiber: Fiber) {
    if (this.shouldTrackSideEffects && !fiber.alternate) {
    }
  }

  reconcile(returnFiber: Fiber, currentFiber: Fiber | undefined, el: Element) {
    const isObject = typeof el === 'object' && el !== null
  }
}

export function reconcileChildren(
  current: Fiber | undefined,
  WIP: Fiber,
  nextElement: Element
) {
  if (!current) {
  } else {
  }
}
