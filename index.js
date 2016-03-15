/**
 * Created by Wojteek on 01.03.2016.
 */
'use strict';

var extend = require('extend'),
	fs = require('fs'),
	async = require('async'),
	path = require('path'),
	chalk = require('chalk');

module.exports = function () {
	var configs = {},
		symlinks = [],
		settings = {};

	var prepareConfigsObject = function () {
		var symlinksConfigs = settings['symlinks_configs'];

		if ('object' === typeof symlinksConfigs && 0 === symlinksConfigs.length) {
			console.error(chalk.red('Symlinks configs list is empty!'));
		}

		async.map(symlinksConfigs, function (file, callback) {
			fs.readFile(file, 'utf8', function (error, data) {
				if (error) {
					return callback(error);
				}

				try {
					configs[file] = JSON.parse(data);
				} catch (e) {
					return callback(e);
				}

				callback();
			});
		}, prepareSymlinksObject);
	};

	/**
	 * @param {string|null} error
	 */
	var prepareSymlinksObject = function (error) {
		if (error) {
			console.error(chalk.red(error.message));

			return false;
		}

		async.forEachOf(configs, function (value, key, callback) {
			var dir = path.dirname(key),
				counterCatalog = 0;

			for (var catalog in value) {
				if (value.hasOwnProperty(catalog)) {
					var isMainDir = 'main' === catalog,
						counterFiles = 0;

					value[catalog].forEach(function (src) {
						symlinks.push({
							dest: dir + '/' + (false === isMainDir ? (counterCatalog < 10 ? '0' + counterCatalog : counterCatalog) + '.' + catalog : ''),
							src: src,
							file_name: (counterFiles < 10 ? '0' + counterFiles : counterFiles) + '.' + path.basename(src)
						});

						counterFiles++
					});
				}

				if (false === isMainDir) {
					counterCatalog++;
				}
			}

			callback();
		}, createSymlinks);
	};

	var createSymlinks = function () {
		symlinks.forEach(function (symlink) {
			fs.mkdir(symlink.dest, function () {
				var symlinkPath = path.normalize(symlink.dest + '/' + symlink.file_name);

				fs.symlink(symlink.src, symlinkPath, function (error) {
					var isError = null !== error && 'EEXIST' === error.code,
						info = isError ? chalk.gray : chalk.green;

					console.log(info('%s - %s'), symlinkPath, isError ? 'SYMLINK EXIST' : 'OK');
				});
			});
		});
	};

	/**
	 * Setter for settings
	 * @param {object} configs
	 */
	var setSettings = function (configs) {
		settings = extend({}, require('./symlinks.json'), configs || {});
	};

	return {
		init: function (configs) {
			setSettings(configs);
			prepareConfigsObject();
		}
	};
};