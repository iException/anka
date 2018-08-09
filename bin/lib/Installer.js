const npm = require('npm');
const fs = require('fs')
const ANKA_CONFIG = '/anka.config.json'

class _Installer {

	constructor(packages) {
		this.packages = packages;
	}

	init() {
		return new Promise(resolve => {
			npm.load(error => {
				error ? process.exit(1) : resolve()
			}) 
		})
	}

	async install() {
		await this.init();
		return new Promise((resolve, reject) => {
			npm.commands.install(this.packages, (error, data) => {
				error ? reject(error) : resolve(data)
			});
		})
	}

	async uninstall() {
		await this.init();
		return new Promise((resolve, reject) => {
			npm.commands.uninstall(this.packages, (error, data) => {
				error ? reject(error) : resolve(data)
			});
		}) 
	}

	inject(paths) {
		Promise.all(paths.map(item => {
			let path = item[1] + ANKA_CONFIG
			if (fs.existsSync(path)) {
				let obj = JSON.parse(fs.readFileSync(path, 'utf8'))
				console.log(obj)
			}
		})) 
	}
}

async function installPackages(package, otherPackages) {
	let installer = new _Installer([package, ...otherPackages])
	try {
		let result = await installer.install()
		installer.inject(result)
	} catch (err) {
		console.log('error' + err)
	}
}

async function uninstallPackages(package, otherPackages) {
	let installer = new _Installer([package, ...otherPackages])
	try {
		let result = await installer.uninstall()
	} catch (err) {
		console.log('error' + err)
	}
}

module.exports = { installPackages, uninstallPackages }