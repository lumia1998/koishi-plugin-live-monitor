export declare class AvatarCache {
    private directory;
    private memory;
    private pending;
    constructor(directory: string);
    private cachePath;
    private read;
    private write;
    get(roomId: string, sourceUrl: string | undefined, fetcher: (url: string) => Promise<string | undefined>): Promise<string | undefined>;
}
