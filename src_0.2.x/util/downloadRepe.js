import download from 'download-git-repo'

export default function (repo, path) {
    return new Promise((resolve, reject) => {
        download(repo, path, { clone: true }, err => {
            err ? reject(err) : resolve()
        })
    })
}
