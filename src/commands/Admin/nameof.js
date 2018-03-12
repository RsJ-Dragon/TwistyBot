module.exports.help = {
	description: 'Retrieve names from Discord ids.',
	parameters: '<id>',
	details:
		'This command returns names of users, servers, channels, and roles. ' +
		'Only resources that the bot is connected to are returned, so this command is not a global search.'
};

module.exports.params = {
	min: 1,
	max: 1
};

module.exports.permissions = [
	{ user: '*', block: true }
];

module.exports.run = async function(Discord, client, params, options) {
	let table = new Discord.Table();
	table.header('Type', 'Name', 'ID');
	table.align('llr');

	let id = params[0];

	// Is it a user?
	let user = client.users.get(id);
	if (user)
	{
		table.push('User', user.tag, id);
		if (options.message.guild)
		{
			let member = options.message.guild.members.get(id);
			if (member && member.nickname)
				table.push('Nickname', member.nickname, id);
		}
		return table;
	}

	// Is it a guild?
	let guild = client.guilds.get(id);
	if (guild)
	{
		table.push('Server', guild.name, id);
		return table;
	}

	// Is it a channel?
	let channel = client.channels.get(id);
	if (channel)
	{
		table.push(
			channel.type[0].toUpperCase() + channel.type.slice(1) + ' Channel',
			channel.friendly_name,
			id
		);
		return table;
	}

	// Is it a role?
	if (options.message.guild)
	{
		let role = options.message.guild.roles.get(id);
		if (role)
		{
			table.push('Role', role.name, id);
			return table;
		}
	}

	return Discord.code_block('Not found!');
};
