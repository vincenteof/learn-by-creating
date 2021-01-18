import { Fiber, Hook } from '../types'

let currentlyRenderingFiber: Fiber | undefined

let firstCurrentHook: Hook | undefined
let currentHook: Hook | undefined
let firstWorkInProgressHook: Hook | undefined
let workInProgressHook: Hook | undefined
