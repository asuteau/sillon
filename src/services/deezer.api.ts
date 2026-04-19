import { createServerFn } from '@tanstack/react-start'

export const getDeezerCover = createServerFn()
  .inputValidator((data: { artist: string; title: string }) => data)
  .handler(async ({ data }) => {
    const { fetchDeezerCover } = await import('#/services/deezer.server')
    return fetchDeezerCover(data.artist, data.title)
  })
