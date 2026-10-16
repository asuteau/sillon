import { useEffect, useSyncExternalStore } from 'react'

import { SavedStackSchema } from './scan.schema'
import { EMPTY_STACK } from './stack.model'
import type { Stack } from './stack.model'

// One Stack for the whole app, kept on the device per Discogs user: it
// outlives the scanner, a reload and a locked phone, and is only cleared by
// confirming or Clear stack
let current: Stack = EMPTY_STACK
let owner: string | null = null
const listeners = new Set<() => void>()

const storageKey = (username: string) => `sillon-stack:${username}`

const load = (username: string): Stack => {
  try {
    const saved = localStorage.getItem(storageKey(username))
    if (!saved) return EMPTY_STACK
    const parsed = SavedStackSchema.safeParse(JSON.parse(saved))
    return parsed.success ? parsed.data : EMPTY_STACK
  } catch {
    return EMPTY_STACK
  }
}

const save = (username: string, stack: Stack) => {
  try {
    if (stack.records.length + stack.notFound.length === 0) {
      localStorage.removeItem(storageKey(username))
    } else {
      localStorage.setItem(storageKey(username), JSON.stringify(stack))
    }
  } catch {
    // Storage full or blocked: the Stack lives until the page closes
  }
}

const notify = () => listeners.forEach((listener) => listener())

export const getStack = () => current

export const updateStack = (update: (stack: Stack) => Stack) => {
  const next = update(current)
  if (next === current) return
  current = next
  if (owner) save(owner, next)
  notify()
}

/** The signed-in user's Stack: another Discogs user on the device never
 * sees it */
const bindStack = (username: string) => {
  if (owner === username) return
  owner = username
  current = load(username)
  notify()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useStack = () =>
  useSyncExternalStore(subscribe, getStack, () => EMPTY_STACK)

/** Loads the user's saved Stack, for as long as they're signed in */
export const useSavedStack = (username: string) => {
  useEffect(() => bindStack(username), [username])
  return useStack()
}
