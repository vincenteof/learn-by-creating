import { Props, Element } from './types'

export function createElement<P extends Props = {}>(
  type: Element<P>['type'],
  config: Props,
  ...children: Element[]
) {
  const props = Object.assign({}, config)

  if (children.length === 1) {
    props.children = children[0]
  } else if (children.length > 1) {
    props.children = children
  }

  return {
    type,
    props,
  }
}
