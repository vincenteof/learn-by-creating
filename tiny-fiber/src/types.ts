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
  props: Element<P>['props']
  type: Element<P>['type']
  parent?: Fiber
  sibling?: Fiber
  child?: Fiber
}
