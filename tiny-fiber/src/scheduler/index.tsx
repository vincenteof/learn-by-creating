import { Fiber, FiberRoot, WorkTag, Flags } from '../types'
import { createWIP } from '../fiber'
import beginWork from './beginWork'
import completeWork from './completeWork'

const expireTime = 1
let nextUnitOfWork: Fiber | undefined
let nextEffect: Fiber | undefined
let rootWithPendingPassiveEffects: FiberRoot | undefined

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

function commitRoot(root: FiberRoot, finishedWork: Fiber) {
  let firstEffect: Fiber
  if (finishedWork.flags > Flags.PerformedWork) {
    if (finishedWork.lastEffect) {
      finishedWork.lastEffect.nextEffect = finishedWork
      firstEffect = finishedWork.firstEffect
    } else {
      firstEffect = finishedWork
    }
  } else {
    // There is no effect on the root.
    firstEffect = finishedWork.firstEffect
  }

  nextEffect = firstEffect
  while (nextEffect) {
    commitAllHostEffects()
    if (nextEffect) {
      nextEffect = nextEffect.nextEffect
    }
  }
  // The work-in-progress tree is now the current tree. This must come after
  // the first pass of the commit phase, so that the previous tree is still
  // current during componentWillUnmount, but before the second pass, so that
  // the finished work is current during componentDidMount/Update.
  root.current = finishedWork
  // In the second pass we'll perform all life-cycles and ref callbacks.
  // Life-cycles happen as a separate pass so that all placements, updates,
  // and deletions in the entire tree have already been invoked.
  // This pass also triggers any renderer-specific initial effects.
  nextEffect = firstEffect

  while (nextEffect) {
    commitAllLifeCycles(root)
    if (nextEffect) {
      nextEffect = nextEffect.nextEffect
    }
  }

  // This commit included a passive effect. These do not need to fire until
  // after the next paint. Schedule an callback to fire them in an async
  // event. To ensure serial execution, the callback will be flushed early if
  // we enter rootWithPendingPassiveEffects commit phase before then.
  if (firstEffect !== null && rootWithPendingPassiveEffects !== null) {
    let callback = commitPassiveEffects.bind(null, root, firstEffect)
    // callLifeCycle(callback)
  }
}

function commitAllHostEffects() {}

function commitAllLifeCycles(finishedRoot: FiberRoot) {
  while (nextEffect) {
    const flags = nextEffect.flags
    if (flags & Flags.Update) {
      const current = nextEffect.alternate
      commitLifeCycles(nextEffect)
    }
    if (flags & Flags.Passive) {
      rootWithPendingPassiveEffects = finishedRoot
    }
    nextEffect = nextEffect.nextEffect
  }
}

function commitPassiveEffects(root: FiberRoot, firstEffect: Fiber): void {
  rootWithPendingPassiveEffects = null
  let effect = firstEffect
  do {
    if (effect.flags & Flags.Passive) {
      try {
        // commitPassiveWithEffects(effect)
      } catch (err) {
        console.log(err)
      }
    }
    effect = effect.nextEffect
  } while (effect)
}

function commitLifeCycles(finishedWork: Fiber) {
  switch (finishedWork.tag) {
    case WorkTag.FunctionComponent:
      // commitWithEffectList(UnmountLayout, MountLayout, finishedWork)
      return
    default:
      console.error('Some error happens in `commitLifeCycles`!')
  }
}

function getRootFromFiber(fiber: Fiber) {
  let cur = fiber
  while (cur.tag !== WorkTag.HostRoot && cur.return) {
    cur = fiber.return
  }
  return cur.stateNode as FiberRoot
}
