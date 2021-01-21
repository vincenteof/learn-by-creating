import { Fiber, HookEffectTag } from '../types'

export function commitPlacement(finishedWork: Fiber) {
  // // Recursively insert all host nodes into the parent.
  // const parentFNode = getHostparentFNode(finishedWork)
  // // Note: these two variables *must* always be updated together.
  // let parent
  // let isContainer
  // switch (parentFNode.tag) {
  //   case DNode:
  //     parent = parentFNode.instanceNode
  //     isContainer = false
  //     break
  //   case Root:
  //     parent = parentFNode.instanceNode.containerInfo
  //     isContainer = true
  //     break
  //   default:
  //     console.log('Invalid host parent')
  // }
  // if (parentFNode.effectTag & ContentReset) {
  //   // Reset the text content of the parent before doing any insertions
  //   resetTextContent(parent)
  //   // Clear ContentReset from the effect tag
  //   parentFNode.effectTag &= ~ContentReset
  // }
  // const before = getHostSibling(finishedWork)
  // let node = finishedWork
  // while (true) {
  //   if (node.tag === DNode || node.tag === Text) {
  //     if (before) {
  //       if (isContainer) {
  //         insertInContainerBefore(parent, node.instanceNode, before)
  //       } else {
  //         insertBefore(parent, node.instanceNode, before)
  //       }
  //     } else {
  //       if (isContainer) {
  //         appendChildToContainer(parent, node.instanceNode)
  //       } else {
  //         appendChild(parent, node.instanceNode)
  //       }
  //     }
  //   } else if (node.child !== null) {
  //     node.child.return = node
  //     node = node.child
  //     continue
  //   }
  //   if (node === finishedWork) {
  //     return
  //   }
  //   while (node.sibling === null) {
  //     if (node.return === null || node.return === finishedWork) {
  //       return
  //     }
  //     node = node.return
  //   }
  //   node.sibling.return = node.return
  //   node = node.sibling
  // }
}

export function commitWork(current: Fiber, finishedWork: Fiber) {
  // switch (finishedWork.tag) {
  //   case FComponent: {
  //     return
  //   }
  //   case DNode: {
  //     const instance = finishedWork.instanceNode
  //     if (instance !== null) {
  //       // Commit the work prepared earlier.
  //       const newProps = finishedWork.prevProps
  //       // For hydration we reuse the update path but we treat the oldProps
  //       // as the newProps. The updatePayload will contain the real change in
  //       // this case.
  //       const oldProps = current !== null ? current.prevProps : newProps
  //       const type = finishedWork.type
  //       // TODO: Type the updateQueue to be specific to host components.
  //       const updatePayload = finishedWork.updateQueue
  //       finishedWork.updateQueue = null
  //       if (updatePayload !== null) {
  //         commitUpdate(
  //           instance,
  //           updatePayload,
  //           type,
  //           oldProps,
  //           newProps,
  //           finishedWork
  //         )
  //       }
  //     }
  //     return
  //   }
  //   case Text: {
  //     const textInstance = finishedWork.instanceNode
  //     const newText = finishedWork.prevProps
  //     const oldText = current !== null ? current.prevProps : newText
  //     commitTextUpdate(textInstance, oldText, newText)
  //     return
  //   }
  //   case Root: {
  //     return
  //   }
  //   default:
  //     console.error('Errrrorrrrr!!!')
  // }
}

export function commitDeletion(current: Fiber) {
  // unmountHostComponents(current)
  // detachFiber(current)
}

export function commitWithEffectList(
  unmountTag: HookEffectTag,
  mountTag: HookEffectTag,
  finishedWork: Fiber
) {
  // let lastEffect = finishedWork?.lastEffect
  // if (lastEffect !== null) {
  //   let firstEffect = lastEffect.nextEffect
  //   let effect = firstEffect
  //   do {
  //     if ((effect.tag & unmountTag) !== 0) {
  //       let destroyed = effect.destroyed
  //       effect.destroyed = null
  //       if (destroyed !== null && typeof destroyed === 'function') {
  //         destroyed()
  //       }
  //     }
  //     if ((effect.tag & mountTag) !== 0) {
  //       const mounted = effect.mounted
  //       let destroyed = mounted()
  //       if (typeof destroyed !== 'function') {
  //         destroyed = null
  //       }
  //       effect.destroyed = destroyed
  //     }
  //     effect = effect.next
  //   } while (effect !== firstEffect)
  // }
}
