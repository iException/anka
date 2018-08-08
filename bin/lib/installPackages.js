const npm = require('npm');
const fs = require('fs')

function npmInstall(packages) {
	return new Promise((resolve, reject) => {
		npm.commands.install(packages, function(err, data) {
			err ? resolve(data) : reject(err)
		});

		npm.on('log', function(message) {
			console.log(message);
		});
	})
}

function installPackages(package, otherPackages) {
	let packages = [package, ...otherPackages]
	npm.load(err => {
		npmInstall(packages).then(data => {
			console.log(data)
		}).catch(err => {
			console.log(err)
		});
	});
}

module.exports = installPackages