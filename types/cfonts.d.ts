declare module 'cfonts' {
    interface Cfonts {
        say (str: string, options: any): void
    }

    const cfonts: Cfonts

    export = cfonts
}
