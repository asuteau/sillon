// A one-store IndexedDB key-value. Rejects when IndexedDB is missing (SSR),
// blocked (private mode) or full; callers decide what failure means.

export interface KeyValueStore {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<void>
  del: (key: string) => Promise<void>
}

const result = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onabort = tx.onerror = () => reject(tx.error)
  })

export function idbStore(dbName: string, storeName: string): KeyValueStore {
  let db: Promise<IDBDatabase> | undefined

  const open = () => {
    db ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName)
      request.onupgradeneeded = () =>
        request.result.createObjectStore(storeName)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }).catch((error: unknown) => {
      // Tried again next time: storage may come back
      db = undefined
      throw error
    })
    return db
  }

  const objectStore = async (mode: IDBTransactionMode) =>
    (await open()).transaction(storeName, mode).objectStore(storeName)

  return {
    get: async (key) => result((await objectStore('readonly')).get(key)),
    set: async (key, value) => {
      const store = await objectStore('readwrite')
      store.put(value, key)
      return done(store.transaction)
    },
    del: async (key) => {
      const store = await objectStore('readwrite')
      store.delete(key)
      return done(store.transaction)
    },
  }
}
