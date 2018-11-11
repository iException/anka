import downloadRepo from 'download-git-repo'

export default function (repo: string, path: string) {
    return new Promise((resolve, reject) => {
        downloadRepo(repo, path, { clone: false }, (err: Error) => {
            err ? reject(err) : resolve()
        })
    })
}
