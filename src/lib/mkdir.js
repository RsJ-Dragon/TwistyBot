const fs = require('fs');
const path = require('path');

// https://stackoverflow.com/questions/31645738/how-to-create-full-path-with-nodes-fs-mkdirsync
module.exports = function(targetDir, { isRelativeToScript = false } = {})
{
	const sep = path.sep;
	const initDir = path.isAbsolute(targetDir) ? sep : '';
	const baseDir = isRelativeToScript ? __dirname : '.';

	targetDir.split(sep).reduce((parentDir, childDir) =>
	{
		const curDir = path.resolve(baseDir, parentDir, childDir);
		try
		{
			fs.mkdirSync(curDir);
			// console.log(`Directory ${curDir} created!`);
		} catch (err)
		{
			if (err.code !== 'EEXIST')
			{
				throw err;
			}

			// console.log(`Directory ${curDir} already exists!`);
		}

		return curDir;
	}, initDir);
};