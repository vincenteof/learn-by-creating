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
  flags: Flags
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

export enum Flags {
  NoFlags = 0b00000000000000000000,
  PerformedWork = 0b00000000000000000001,
  Placement = 0b00000000000000000010,
  Update = 0b00000000000000000100,
  PlacementAndUpdate = Placement | Update,
  Deletion = 0b00000000000000001000,
  Incomplete = 0b00000010000000000000,
  Passive = 0b00000000010000000000,
}

export enum HookEffectTag {
  NoEffect = 0b00000000,
  MountPassive = 0b01000000,
  UnmountPassive = 0b10000000,
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
  // the rest fields are for `useReducer`
  baseState?: any
  baseQueue?: Update
  queue?: UpdateQueue
}

export type Effect = {
  tag: HookEffectTag
  create: () => any
  destroy?: () => any
  inputs: Array<any>
  next?: Effect
}

export type FunctionComponentUpdateQueue = {
  lastEffect?: Effect
}

// todo: can i define something like `BasicStateAction<S notExtends Function>`
export type BasicStateAction<S> = S extends Function
  ? (state: S) => S
  : ((state: S) => S) | S

export type Dispatch<A> = (action: A) => void
