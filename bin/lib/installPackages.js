const npm = require('npm');
const fs = require('fs')
const ANKA_CONFIG = '/anka.config.json'

function npmInstall(packages) {
	return new Promise((resolve, reject) => {
		npm.commands.install(packages, function(err, data) {
			err ? reject(err) : resolve(data)
		});

		npm.on('log', function(message) {
			console.log(message);
		});
	})
}

function inspect(packages) {
	Promise.all(packages.map(item => {
		let path = item[1] + ANKA_CONFIG
		if (fs.existsSync(path)) {
			let obj = JSON.parse(fs.readFileSync(path, 'utf8'))
			console.log(obj)
		}
	})) 
}

function installPackages(package, otherPackages) {
	let packages = [package, ...otherPackages]
	npm.load(err => {
		npmInstall(packages).then(data => {
			inspect(data)
		}).catch(err => {
			console.log(err)
		});
	});
}

module.exports = installPackages