import {
  Fiber,
  Hook,
  Flags,
  HookEffectTag,
  Effect,
  FunctionComponentUpdateQueue,
  BasicStateAction,
  Dispatch,
  UpdateQueue,
  Update,
} from '../types'
import { scheduleWork } from '../scheduler'

let currentlyRenderingFiber: Fiber | undefined

// belong to the current fiber
let firstCurrentHook: Hook | undefined
let currentHook: Hook | undefined
// belong to the WIP fiber
let firstWorkInProgressHook: Hook | undefined
let workInProgressHook: Hook | undefined

let componentUpdateQueue: FunctionComponentUpdateQueue = undefined

let isReRender = false
let renderPhaseUpdates: Map<UpdateQueue<any>, Update<any>> | undefined

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

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action
}

// todo: fix any
export function useState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  return useReducer(basicStateReducer as any, initialState) as any
}

export function useReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  initialAction?: A | null | undefined
): [S, Dispatch<A>] {
  workInProgressHook = createWorkInProgressHook()
  let queue: UpdateQueue<A> | undefined = workInProgressHook.queue
  if (queue) {
    // Already have a queue, so this is an update.
    if (isReRender) {
      // This is a re-render. Apply the new render phase updates to the previous
      // work-in-progress hook.
      const dispatch: Dispatch<A> = queue.dispatch
      if (renderPhaseUpdates) {
        // Render phase updates are stored in a map of queue -> linked list
        const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue)
        if (firstRenderPhaseUpdate !== undefined) {
          renderPhaseUpdates.delete(queue)
          let newState = workInProgressHook.memoizedState
          let update = firstRenderPhaseUpdate
          do {
            // Process this render phase update. We don't have to check the
            // priority because it will always be the same as the current
            // render's.
            const action = update.action
            newState = reducer(newState, action)
            update = update.next
          } while (update)

          workInProgressHook.memoizedState = newState

          // Don't persist the state accumlated from the render phase updates to
          // the base state unless the queue is empty.
          // TODO: Not sure if this is the desired semantics, but it's what we
          // do for gDSFP. I can't remember why.
          if (workInProgressHook.baseQueue === queue.last) {
            workInProgressHook.baseState = newState
          }

          return [newState, dispatch]
        }
      }
      return [workInProgressHook.memoizedState, dispatch]
    }
    // The last update in the entire queue
    const last = queue.last
    // The last update that is part of the base state.
    const baseQueue = workInProgressHook.baseQueue

    // Find the first unprocessed update.
    let first: Update
    if (baseQueue) {
      if (last) {
        // For the first update, the queue is a circular linked list where
        // `queue.last.next = queue.first`. Once the first update commits, and
        // the `baseUpdate` is no longer empty, we can unravel the list.
        last.next = undefined
      }
      first = baseQueue.next
    } else {
      first = last?.next
    }
    if (first) {
      let newState = workInProgressHook.baseState
      let newBaseState = undefined
      let newBaseUpdate = undefined
      let update = first
      do {
        // todo: priority and time
        const action = update.action
        newState = reducer(newState, action)
        update = update.next
      } while (update && update !== first)
      workInProgressHook.memoizedState = newState
      workInProgressHook.baseQueue = newBaseUpdate
      workInProgressHook.baseState = newBaseState
    }

    const dispatch: Dispatch<A> = queue.dispatch
    return [workInProgressHook.memoizedState, dispatch]
  }
  // There's no existing queue, so this is the initial render.
  if (reducer === basicStateReducer) {
    // Special case for `useState`.
    if (typeof initialState === 'function') {
      initialState = initialState()
    }
  } else if (initialAction !== undefined && initialAction !== null) {
    initialState = reducer(initialState, initialAction)
  }
  workInProgressHook.baseState = initialState
  workInProgressHook.memoizedState = workInProgressHook.baseState
  workInProgressHook.queue = {
    last: undefined,
    dispatch: undefined,
  }
  queue = workInProgressHook.queue
  queue.dispatch = dispatchAction.bind(
    undefined,
    currentlyRenderingFiber,
    queue
  )
  const dispatch: Dispatch<A> = queue.dispatch
  return [workInProgressHook.memoizedState, dispatch]
}

function dispatchAction<A>(fiber: Fiber, queue: UpdateQueue<A>, action: A) {
  const alternate = fiber.alternate
  if (
    fiber === currentlyRenderingFiber ||
    (alternate && alternate === currentlyRenderingFiber)
  ) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    const update: Update<A> = {
      action,
      next: null,
    }
    if (!renderPhaseUpdates) {
      renderPhaseUpdates = new Map()
    }
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue)
    if (!firstRenderPhaseUpdate) {
      renderPhaseUpdates.set(queue, update)
    } else {
      // Append the update to the end of the list.
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate
      while (lastRenderPhaseUpdate.next) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next
      }
      lastRenderPhaseUpdate.next = update
    }
  } else {
    const update: Update<A> = {
      action,
      next: null,
    }
    // Append the update to the end of the list.
    const last = queue.last
    if (last === null) {
      // This is the first update. Create a circular list.
      update.next = update
    } else {
      const first = last.next
      if (first !== null) {
        // Still circular.
        update.next = first
      }
      last.next = update
    }
    queue.last = update
    scheduleWork(fiber)
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
    effect.next = effect
    componentUpdateQueue.lastEffect = effect.next
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

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: undefined,
  } as FunctionComponentUpdateQueue
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
