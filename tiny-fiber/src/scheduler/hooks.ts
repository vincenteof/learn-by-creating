import {
  Fiber,
  Hook,
  Flags,
  HookEffectTag,
  Effect,
  FunctionComponentUpdateQueue,
} from '../types'

let currentlyRenderingFiber: Fiber | undefined

let firstCurrentHook: Hook | undefined
let currentHook: Hook | undefined
let firstWorkInProgressHook: Hook | undefined
let workInProgressHook: Hook | undefined

let componentUpdateQueue = undefined

let isReRender = false

export function prepareHooks(current: Fiber | undefined, WIP: Fiber) {
  currentlyRenderingFiber = WIP
  firstCurrentHook = current?.memoizedState
}

export function finishHooks() {
  const renderedWork = currentlyRenderingFiber
  renderedWork.memoizedState = firstWorkInProgressHook
  renderedWork.updateQueue = componentUpdateQueue

  currentlyRenderingFiber = undefined
  firstCurrentHook = undefined
  currentHook = undefined
  workInProgressHook = undefined
  firstWorkInProgressHook = undefined
}

export function resetHooks() {
  currentlyRenderingFiber = undefined
  firstCurrentHook = undefined
  currentHook = undefined
  workInProgressHook = undefined
  firstWorkInProgressHook = undefined
}

function createHook(): Hook {
  return {
    memoizedState: undefined,
    baseState: undefined,
    queue: undefined,
    baseQueue: undefined,
    next: undefined,
  }
}

function cloneHook(hook: Hook): Hook {
  return {
    memoizedState: hook.memoizedState,
    baseState: hook.memoizedState,
    queue: hook.queue,
    baseQueue: hook.baseQueue,
    next: undefined,
  }
}

export function useEffect(create: Effect['create'], inputs: Effect['inputs']) {
  useEffectImpl(
    Flags.Update | Flags.Passive,
    HookEffectTag.UnmountPassive | HookEffectTag.MountPassive,
    create,
    inputs
  )
}

function useEffectImpl(
  fiberEffectTag: Flags,
  hookEffectTag: HookEffectTag,
  create: Effect['create'],
  inputs: Effect['inputs']
): void {
  workInProgressHook = createWorkInProgressHook()
  let nextInputs = inputs !== undefined && inputs !== null ? inputs : [create]
  let destroy = undefined
  if (currentHook) {
    const prevEffect = currentHook.memoizedState
    destroy = prevEffect.destroy
    if (areHookInputsEqual(nextInputs, prevEffect.inputs)) {
      pushEffect(HookEffectTag.NoEffect, create, destroy, nextInputs)
      return
    }
  }

  currentlyRenderingFiber.flags |= fiberEffectTag
  workInProgressHook.memoizedState = pushEffect(
    hookEffectTag,
    create,
    destroy,
    nextInputs
  )
}

function createWorkInProgressHook(): Hook {
  if (!workInProgressHook) {
    // This is the first hook in the list
    if (!firstWorkInProgressHook) {
      isReRender = false
      currentHook = firstCurrentHook
      if (!currentHook) {
        // This is a newly mounted hook
        workInProgressHook = createHook()
      } else {
        // Clone the current hook.
        workInProgressHook = cloneHook(currentHook)
      }
      firstWorkInProgressHook = workInProgressHook
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true
      currentHook = firstCurrentHook
      workInProgressHook = firstWorkInProgressHook
    }
  } else {
    if (!workInProgressHook.next) {
      isReRender = false
      let hook: Hook
      if (!currentHook) {
        // This is a newly mounted hook
        hook = createHook()
      } else {
        currentHook = currentHook.next
        if (!currentHook) {
          // This is a newly mounted hook
          hook = createHook()
        } else {
          // Clone the current hook.
          hook = cloneHook(currentHook)
        }
      }
      // Append to the end of the list
      workInProgressHook.next = hook
      workInProgressHook = workInProgressHook.next
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true
      workInProgressHook = workInProgressHook.next
      currentHook = currentHook?.next
    }
  }
  return workInProgressHook
}

function pushEffect(
  tag: HookEffectTag,
  create: Effect['create'],
  destroy: Effect['destroy'],
  inputs: Effect['inputs']
) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    inputs,
  }
  if (!componentUpdateQueue) {
    componentUpdateQueue = createFunctionComponentUpdateQueue()
    componentUpdateQueue.lastEffect = effect.next = effect
  } else {
    const lastEffect = componentUpdateQueue.lastEffect
    if (!lastEffect) {
      effect.next = effect
      componentUpdateQueue.lastEffect = effect.next
    } else {
      const firstEffect = lastEffect.next
      lastEffect.next = effect
      effect.next = firstEffect
      componentUpdateQueue.lastEffect = effect
    }
  }
  return effect
}

function createFunctionComponentUpdateQueue(): FunctionComponentUpdateQueue {
  return {
    lastEffect: undefined,
  }
}

function areHookInputsEqual(
  nextDeps: Array<any>,
  prevDeps: Array<any> | undefined
) {
  if (!prevDeps) {
    return false
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue
    }
    return false
  }
  return true
}
