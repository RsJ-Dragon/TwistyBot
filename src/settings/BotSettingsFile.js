let fs = require('fs');
let mkdir = src_require('lib/mkdir');

class BotSettingsFile
{
	constructor()
	{
		this.savefile = BotSettingsFile.SAVE_DIRECTORY + '/bot.json';
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
BotSettingsFile.SAVE_DIRECTORY = './storage/bot_settings';
mkdir(BotSettingsFile.SAVE_DIRECTORY);

module.exports = BotSettingsFile;
