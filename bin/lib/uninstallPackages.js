const npm = require('npm');
const fs = require('fs')

function npmUninstall(packages) {
	return new Promise((resolve, reject) => {
		npm.commands.uninstall(packages, function(err, data) {
			err ? resolve(data) : reject(err)
		});

		npm.on('log', function(message) {
			console.log(message);
		});
	})
}

function uninstallPackages(package, otherPackages) {
	let packages = [package, ...otherPackages]
	npm.load(err => {
		npmUninstall(packages).then(data => {
			console.log(data)
		}).catch(err => {
			console.log(err)
		});
	});
}

module.exports = uninstallPackages