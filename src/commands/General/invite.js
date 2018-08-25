module.exports.help = {
	description: 'Show the link to invite the bot to your server.',
	parameters: '',
	details: ''
};

module.exports.params = {};

module.exports.permissions = [];
module.exports.aliases = [ 'invite_link' ];

module.exports.run = async function(Discord, client, params, options) {
	return "TwistyBot: " + Discord.link('https://discordapp.com/oauth2/authorize?client_id=228019028755611648&permissions=0&scope=bot') +
		"\nRuneWatch: " + Discord.link('https://discord.gg/3yCq35d');
	// return Discord.link(`https://discordapp.com/oauth2/authorize?client_id=${ client.user.id }&permissions=0&scope=bot`);
};
