declare module 'cfonts' {
    interface Cfonts {
        say (str: string, options: any): void
    }

    const cfonts: Cfonts

    export default cfonts
}

declare type LoaderOption = {
    loader: string,
    options: Object
}

declare type Content = string | Buffer

declare type Loader = <T>(content: Content) => T

declare type Plugin = () => void
