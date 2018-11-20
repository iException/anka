import downloadRepo from 'download-git-repo'

export default function (repo: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        downloadRepo(repo, path, { clone: false }, (err: Error) => {
            err ? reject(err) : resolve()
        })
    })
}
