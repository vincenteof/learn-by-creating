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
}

export interface Fiber<P = Props> {
  type: Element<P>['type']
  pendingProps: Element<P>['props']
  prevProps: Element<P>['props']
  return?: Fiber
  sibling?: Fiber
  child?: Fiber
  alternate?: Fiber
  stateNode?: FiberRoot | Node
  tag: WorkTag
  effectFlag: EffectFlag
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

export enum EffectFlag {
  NoFlags = 0b00000000000000000000,
  PerformedWork = 0b00000000000000000001,
  Placement = 0b00000000000000000010,
  Update = 0b00000000000000000100,
  PlacementAndUpdate = Placement | Update,
  Deletion = 0b00000000000000001000,
}
