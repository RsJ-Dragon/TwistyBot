let fs = require('fs');
let mkdir = src_require('lib/mkdir');

class UserSettingsFile
{
	constructor(id)
	{
		this.id = id;
		this.savefile = UserSettingsFile.SAVE_DIRECTORY + '/' + id + '.json';
		if (fs.existsSync(this.savefile))
		{
			// Load the file
			this.cache = root_require(this.savefile);
		}
		else
		{
			// Create the file
			this.cache = {};
			this.save();
		}
	}

	async get(key)
	{
		return this.cache[key];
	}

	async set(key, value)
	{
		this.cache[key] = value;
		this.save();
	}

	save()
	{
		if (Object.keys(this.cache).length > 0)
			fs.writeFileSync(this.savefile, JSON.stringify(this.cache), 'utf8');
	}

	async clear()
	{
		this.cache = {};
		fs.unlink(this.savefile, function(err)
		{
			if (err) { console.warn(err); }
		});
	}
}

// Set up settings directory
UserSettingsFile.SAVE_DIRECTORY = './storage/user_settings';
mkdir(UserSettingsFile.SAVE_DIRECTORY);

module.exports = UserSettingsFile;
