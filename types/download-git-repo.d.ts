declare module 'download-git-repo' {
    function download (repo: string, path: string, options: any, callback: (err: Error) => void): void
    export = download
}
