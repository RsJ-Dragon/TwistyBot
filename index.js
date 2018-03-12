/***************************************************************
 *                       Globals
 ***************************************************************/
// Node only logs the error message, without a stack trace for unhandled promise rejections
// So we catch rejections here to log the stack and prevent killing the bot
process.on('unhandledRejection', function(err)
{
	console.warn(err)
	bot.log_error(err);
});

// Require relative to project top level folder
global.root_require = name => require(__dirname + '/' + name);
// Require relative to src folder
global.src_require = name => require(__dirname + '/src/' + name);

// Override console.* with custom output
src_require('console_hook');

// Load config
global.config = Object.assign(
	root_require('config/default_config'),
	// First parameter is config file name, default = config
	root_require('config/' + (process.argv[2] || 'config'))
);

/***************************************************************
 *                      Set up bot
 ***************************************************************/
let twistybot = require('twistybot');
let bot = null;
async function main()
{
	bot = new twistybot.Client(
		{
			messageCacheMaxSize: 1,
			prefix: '!',
			guild_config: src_require('settings/GuildSettingsFile'),
			user_config: src_require('settings/UserSettingsFile'),
			bot_config: src_require('settings/BotSettingsFile'),
			global_permissions: config.get('global_permissions'),
			error_channel: '309556812594806786' // RS JUSTICE.bot-errors
		}
	);

	// Register commands
	await bot.add_default_commands();
	await bot.add_command_directory(__dirname + '/src/commands');

	// Load all files in background directory
	let files = require('fs').readdirSync(__dirname + '/src/background');
	// Call each script in 'parallel'
	let promises = files.map(filename => require(__dirname + '/src/background/' + filename)(bot));
	// Wait for all of them to finish
	await Promise.all(promises);

	// Set motd on login
	bot.on('ready', async function()
	{
		let motd = await bot.config.get('motd');
		if (motd)
		{
			await bot.user.setPresence({ game: { name: motd, type: 0 } });
		}
	});

	// Begin listening for commands
	bot.login(config.get('token'));
}

main();
