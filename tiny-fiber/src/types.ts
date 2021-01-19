// only support functional components
export type JSXElementConstructor<P> = (props: P) => Element<P> | null

export type Props = Record<string, any>
export interface Element<
  P = Props,
  T extends string | JSXElementConstructor<P> =
    | string
    | JSXElementConstructor<P>
> {
  props: P
  type: T
  key?: string
}

export type Thing = Element | Thing[]

export interface Fiber<P = Props> {
  type: Element<P>['type']
  pendingProps: Element<P>['props']
  memoizedProps: Element<P>['props']
  key?: Element<P>['key']
  return?: Fiber
  sibling?: Fiber
  child?: Fiber
  alternate?: Fiber
  stateNode?: FiberRoot | Node
  index?: number
  tag: WorkTag
  EffectTag: EffectTag
  memoizedState?: any
  updateQueue?: UpdateQueue
}

export interface RootRenderer {
  render: () => Element
  injectElement: (elem: Element) => void
}
export interface FiberRoot {
  current: Fiber
  containerInfo: Node
  renderer: RootRenderer
}

export enum WorkTag {
  FunctionComponent = 0,
  HostRoot = 1,
  DOMComponent = 2,
}

export enum EffectTag {
  NoFlags = 0b00000000000000000000,
  PerformedWork = 0b00000000000000000001,
  Placement = 0b00000000000000000010,
  Update = 0b00000000000000000100,
  PlacementAndUpdate = Placement | Update,
  Deletion = 0b00000000000000001000,
  Incomplete = 0b00000010000000000000,
}

export type Update<A = any> = {
  action: A
  next: Update<A> | undefined
}

export type UpdateQueue<A = any> = {
  last: Update<A> | undefined
  dispatch: any
}
export interface Hook {
  memoizedState?: any
  next?: Hook
  baseState?: any
  baseQueue?: Update
  queue?: UpdateQueue
}

export type Effect = {
  tag: EffectTag
  create: () => any
  destroy?: () => any
  inputs: Array<any>
  next?: Effect
}

export type FunctionComponentUpdateQueue = {
  lastEffect?: Effect
}
