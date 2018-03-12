module.exports.help = {
	description: 'Set message of the day (Now playing text).',
	parameters: '<motd>',
};

module.exports.params = {
	parser: 'raw'
};

module.exports.permissions = [
	{ user: '*', block: true }
];

module.exports.run = async function(Discord, client, params, options) {
	try
	{
		if (params == '')
		{
			await client.config.set('motd', null);
			await client.user.setPresence({ game: null });
		}
		else
		{
			await client.config.set('motd', params);
			await client.user.setPresence({ game: { name: params, type: 0 } });
		}
	}
	catch(e)
	{
		return Discord.code_block(e.message);
	}

	return Discord.code_block('Done!');
};
