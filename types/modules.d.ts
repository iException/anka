declare module 'cfonts' {
    interface Cfonts {
        say (str: string, options: any): void
    }

    const cfonts: Cfonts

    export = cfonts
}

declare module 'postcss-load-config' {
    export default function (options: object): any
}

declare module 'download-git-repo' {
    function download (repo: string, path: string, options: any, callback: (err: Error) => void): void
    export default download
}
