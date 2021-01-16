import { Fiber, Element, Thing, EffectFlag } from './types'
import { createFiberFromElement, createWIP } from './fiber'
import { flow } from 'lodash-es'

class ChildReconciler {
  shouldTrackSideEffects: boolean

  constructor(shouldTrackSideEffects: boolean) {
    this.shouldTrackSideEffects = shouldTrackSideEffects
  }

  deleteChild = (returnFiber: Fiber, childToDelete: Fiber) => {
    if (!this.shouldTrackSideEffects) {
      return
    }
    // todo: to mark it is deleted
  }

  deleteRemainingChildren = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | undefined
  ) => {
    if (!this.shouldTrackSideEffects) {
      return undefined
    }

    let childToDelete = currentFirstChild
    while (childToDelete !== null) {
      this.deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling
    }
    return undefined
  }

  useFiber = (fiber: Fiber, props: Record<string, any>) => {
    let clone = createWIP(fiber, props)
    clone.index = 0
    return clone
  }

  updateElement = (
    returnFNode: Fiber,
    current: Fiber | undefined,
    element: Element
  ) => {
    if (current !== null && current.type === element.type) {
      const existing = this.useFiber(current, element.props)
      existing.return = returnFNode
      return existing
    }
    const created = createFiberFromElement(element)
    created.return = returnFNode
    return created
  }

  updateSlot = (
    returnFiber: Fiber,
    oldFiber: Fiber | undefined,
    nextThing: Thing
  ) => {
    const key = oldFiber?.key
    if (nextThing && typeof nextThing === 'object') {
      if (!Array.isArray(nextThing)) {
        if (nextThing.key === key) {
          return this.updateElement(returnFiber, oldFiber, nextThing)
        }
        return undefined
      }
      // todo: the element of the array is an array, the fragment
    }

    return undefined
  }

  reconcileSingleElement = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | undefined,
    nextElement: Element
  ) => {
    let child = currentFirstChild
    while (child) {
      if (child.key === nextElement.key) {
        if (child.type === nextElement.type) {
          this.deleteRemainingChildren(returnFiber, child.sibling)
          const existing = this.useFiber(child, nextElement.props)
          existing.return = returnFiber
          return existing
        } else {
          this.deleteRemainingChildren(returnFiber, child.sibling)
          break
        }
      }
      child = child.sibling
    }
    const created = createFiberFromElement(nextElement)
    created.return = returnFiber
    return created
  }

  reconcileChildrenArray = (
    returnFiber: Fiber,
    currentFirstChild: Fiber | undefined,
    nextThing: Thing[]
  ) => {
    let resultingFirstChild = undefined
    let previousNewFiber = undefined

    let oldFiber = currentFirstChild
    let lastPlacedIndex = 0
    let newIdx = 0
    let nextOldFiber = undefined

    for (; oldFiber && newIdx < nextThing.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber
        oldFiber = undefined
      } else {
        nextOldFiber = oldFiber.sibling
      }
      const newFiber = this.updateSlot(returnFiber, oldFiber, nextThing[newIdx])
      if (!newFiber) {
        if (!oldFiber) {
          oldFiber = nextOldFiber
        }
        break
      }
      lastPlacedIndex = this.placeChild(newFiber, lastPlacedIndex, newIdx)
      if (!previousNewFiber) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
      oldFiber = nextOldFiber
    }

    if (newIdx === nextThing.length) {
      this.deleteRemainingChildren(returnFiber, oldFiber)
      return resultingFirstChild
    }

    if (oldFiber === null) {
      for (; newIdx < nextThing.length; newIdx++) {
        const newFiber = this.createChild(returnFiber, nextThing[newIdx])
        if (!newFiber) {
          continue
        }
        lastPlacedIndex = this.placeChild(newFiber, lastPlacedIndex, newIdx)
        if (!previousNewFiber) {
          resultingFirstChild = newFiber
        } else {
          previousNewFiber.sibling = newFiber
        }
        previousNewFiber = newFiber
      }
      return resultingFirstChild
    }

    // this.mapRemainingChildren(returnFiber, oldFiber)
    return resultingFirstChild
  }

  placeSingleChild = (fiber: Fiber) => {
    if (this.shouldTrackSideEffects && !fiber.alternate) {
      fiber.effectFlag = EffectFlag.Placement
    }
    return fiber
  }

  createChild = (returnFiber: Fiber, newThing: Thing) => {
    if (newThing && typeof newThing === 'object') {
      if (!Array.isArray(newThing)) {
        const created = createFiberFromElement(newThing)
        created.return = returnFiber
        return created
      }
      // todo:
    }
    return undefined
  }

  placeChild = (newFiber: Fiber, lastPlacedIndex: number, newIndex: number) => {
    newFiber.index = newIndex
    if (!this.shouldTrackSideEffects) {
      return lastPlacedIndex
    }
    const current = newFiber.alternate
    if (current) {
      const oldIndex = current.index
      if (oldIndex < lastPlacedIndex) {
        newFiber.effectFlag = EffectFlag.Placement
        return lastPlacedIndex
      } else {
        return oldIndex
      }
    } else {
      newFiber.effectFlag = EffectFlag.Placement
      return lastPlacedIndex
    }
  }

  reconcile(
    returnFiber: Fiber,
    currentFirstChild: Fiber | undefined,
    nextThing: Thing
  ) {
    const isObject = nextThing && typeof nextThing === 'object'
    if (isObject) {
      return flow(this.reconcileSingleElement, this.placeSingleChild)(
        returnFiber,
        currentFirstChild,
        nextThing as Element
      )
    }
    if (Array.isArray(nextThing)) {
      return this.reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        nextThing as Thing[]
      )
    }
    return this.deleteRemainingChildren(returnFiber, currentFirstChild)
  }
}

const reconciler = new ChildReconciler(true)
const mounter = new ChildReconciler(false)

export function reconcileChildren(
  current: Fiber | undefined,
  WIP: Fiber,
  nextThing: Thing
) {
  if (!current) {
    WIP.child = mounter.reconcile(WIP, null, nextThing)
  } else {
    WIP.child = reconciler.reconcile(WIP, current.child, nextThing)
  }
}
