import { Fiber, Element, EffectFlag } from './types'

class ChildReconciler {
  shouldTrackSideEffects: boolean

  constructor(shouldTrackSideEffects: boolean) {
    this.shouldTrackSideEffects = shouldTrackSideEffects
  }

  reconcileSingleElement = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | undefined,
    el: Element
  ) => {
    let child = currentFirstChild
    while (child) {}
  }

  placeSingleChild = (fiber: Fiber) => {
    if (this.shouldTrackSideEffects && !fiber.alternate) {
      fiber.effectFlag = EffectFlag.Placement
    }
    return fiber
  }

  reconcile(
    returnFiber: Fiber,
    currentFirstChild: Fiber | undefined,
    el: Element
  ) {
    const isObject = typeof el === 'object' && !el
    if (isObject) {
    }
  }
}

const reconciler = new ChildReconciler(true)
const mounter = new ChildReconciler(false)

export function reconcileChildren(
  current: Fiber | undefined,
  WIP: Fiber,
  nextElement: Element
) {
  if (!current) {
    WIP.child = mounter.reconcile(WIP, null, nextElement)
  } else {
    WIP.child = reconciler.reconcile(WIP, current.child, nextElement)
  }
}
