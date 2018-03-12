module.exports.help = {
	description: 'Set bot avatar.',
	parameters: '<url>',
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
		await client.user.setAvatar(params);
	}
	catch(e)
	{
		return Discord.code_block(e.message);
	}

	return Discord.code_block('Done!');
};
