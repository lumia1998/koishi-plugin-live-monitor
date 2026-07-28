import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

interface AvatarCacheEntry {
  sourceUrl: string
  dataUrl: string
}

function isAvatarCacheEntry(value: unknown): value is AvatarCacheEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.sourceUrl === 'string'
    && typeof entry.dataUrl === 'string'
    && entry.dataUrl.startsWith('data:image/')
}

export class AvatarCache {
  private memory = new Map<string, AvatarCacheEntry>()
  private pending = new Map<string, Promise<string | undefined>>()

  constructor(private directory: string) {}

  private cachePath(roomId: string) {
    return join(this.directory, `${roomId}.json`)
  }

  private async read(roomId: string) {
    const memoryEntry = this.memory.get(roomId)
    if (memoryEntry) return memoryEntry
    try {
      const entry: unknown = JSON.parse(await readFile(this.cachePath(roomId), 'utf8'))
      if (!isAvatarCacheEntry(entry)) return
      this.memory.set(roomId, entry)
      return entry
    } catch {
      return
    }
  }

  private async write(roomId: string, entry: AvatarCacheEntry) {
    await mkdir(this.directory, { recursive: true })
    const target = this.cachePath(roomId)
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`
    await writeFile(temporary, JSON.stringify(entry), 'utf8')
    await rename(temporary, target)
    this.memory.set(roomId, entry)
  }

  async get(
    roomId: string,
    sourceUrl: string | undefined,
    fetcher: (url: string) => Promise<string | undefined>,
  ): Promise<string | undefined> {
    const cached = await this.read(roomId)
    if (!sourceUrl || cached?.sourceUrl === sourceUrl) return cached?.dataUrl

    const pendingKey = `${roomId}\x00${sourceUrl}`
    const existingRequest = this.pending.get(pendingKey)
    if (existingRequest) return existingRequest

    const request = (async () => {
      const dataUrl = await fetcher(sourceUrl)
      if (!dataUrl?.startsWith('data:image/')) return cached?.dataUrl
      const entry = { sourceUrl, dataUrl }
      try {
        await this.write(roomId, entry)
      } catch {
        return dataUrl
      }
      return dataUrl
    })()
    this.pending.set(pendingKey, request)
    try {
      return await request
    } finally {
      this.pending.delete(pendingKey)
    }
  }
}
