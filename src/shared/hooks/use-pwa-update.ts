import { useRegisterSW } from 'virtual:pwa-register/react'

export const usePwaUpdate = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return { needRefresh, updateServiceWorker }
}
