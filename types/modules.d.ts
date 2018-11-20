declare module 'cfonts' {
    type prettyFont = {
        string: string  // the ansi string for sexy console font
        array: number   // returns the array for the output
        lines: number   // returns the lines used
        options: any // returns the options used
    }

    interface Cfonts {
        say (str: string, options: any): void
        render (str: string, options: any): prettyFont
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
