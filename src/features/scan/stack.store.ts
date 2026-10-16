import { useSyncExternalStore } from 'react'

import { EMPTY_STACK } from './stack.model'
import type { Stack } from './stack.model'

// One Stack for the whole app: it outlives the scanner, so closing the
// drawer never loses what was scanned
let current: Stack = EMPTY_STACK
const listeners = new Set<() => void>()

export const getStack = () => current

export const updateStack = (update: (stack: Stack) => Stack) => {
  const next = update(current)
  if (next === current) return
  current = next
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useStack = () =>
  useSyncExternalStore(subscribe, getStack, () => EMPTY_STACK)
