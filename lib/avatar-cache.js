"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarCache = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
function isAvatarCacheEntry(value) {
    if (!value || typeof value !== 'object')
        return false;
    const entry = value;
    return typeof entry.sourceUrl === 'string'
        && typeof entry.dataUrl === 'string'
        && entry.dataUrl.startsWith('data:image/');
}
class AvatarCache {
    constructor(directory) {
        this.directory = directory;
        this.memory = new Map();
        this.pending = new Map();
    }
    cachePath(roomId) {
        return (0, node_path_1.join)(this.directory, `${roomId}.json`);
    }
    async read(roomId) {
        const memoryEntry = this.memory.get(roomId);
        if (memoryEntry)
            return memoryEntry;
        try {
            const entry = JSON.parse(await (0, promises_1.readFile)(this.cachePath(roomId), 'utf8'));
            if (!isAvatarCacheEntry(entry))
                return;
            this.memory.set(roomId, entry);
            return entry;
        }
        catch {
            return;
        }
    }
    async write(roomId, entry) {
        await (0, promises_1.mkdir)(this.directory, { recursive: true });
        const target = this.cachePath(roomId);
        const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
        await (0, promises_1.writeFile)(temporary, JSON.stringify(entry), 'utf8');
        await (0, promises_1.rename)(temporary, target);
        this.memory.set(roomId, entry);
    }
    async get(roomId, sourceUrl, fetcher) {
        const cached = await this.read(roomId);
        if (!sourceUrl || cached?.sourceUrl === sourceUrl)
            return cached?.dataUrl;
        const pendingKey = `${roomId}\x00${sourceUrl}`;
        const existingRequest = this.pending.get(pendingKey);
        if (existingRequest)
            return existingRequest;
        const request = (async () => {
            const dataUrl = await fetcher(sourceUrl);
            if (!dataUrl?.startsWith('data:image/'))
                return cached?.dataUrl;
            const entry = { sourceUrl, dataUrl };
            try {
                await this.write(roomId, entry);
            }
            catch {
                return dataUrl;
            }
            return dataUrl;
        })();
        this.pending.set(pendingKey, request);
        try {
            return await request;
        }
        finally {
            this.pending.delete(pendingKey);
        }
    }
}
exports.AvatarCache = AvatarCache;
