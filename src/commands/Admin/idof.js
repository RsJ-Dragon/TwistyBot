module.exports.help = {
	description: 'Retrieve Discord ids from names.',
	parameters: '<name>',
	details: 'Name can be a server, a server channel, a user (tag optional), a nickname, or a role.',
	examples: [
		{
			params: 'Twisty Fork',
			result: 'Retrieve the IDs of any user named or nicknamed Twisty Fork.'
		},
		{
			params: 'Twisty Fork#0899',
			result: 'Retrieve the ID of user Twisty Fork#0899.'
		},
		{
			params: 'RuneWatch',
			result: 'Retrieve the ID of the RuneWatch server.'
		},
		{
			params: 'RuneWatch.public',
			result: 'Retrieve the ID of RuneWatch\'s public channel.'
		},
		{
			params: 'DM.Twisty Fork',
			result: 'Retrieve the ID of the bot\'s DM channel with Twisty Fork'
		}
	]
};

module.exports.params = {
	min: 1,
	max: 1
};

module.exports.permissions = [
	{ user: '*', block: true }
];

module.exports.run = async function(Discord, client, params, options) {
	// \u200B == zero width space (sometimes present in mentions?)
	let name = params[0].replace(/\u200B/,'').toLowerCase();

	let table = new Discord.Table();
	table.header('Type', 'Name', 'ID');
	table.align('llr');


	// Is it a user?
	client.users.forEach(function(user) {
		if (user.username.toLowerCase() == name || user.tag.toLowerCase() == name)
		{
			table.push('User', user.tag, user.id);
		}
	});

	// Is it a guild?
	client.guilds.forEach(function(guild) {
		if (guild.name.toLowerCase() == name)
		{
			table.push('Server', guild.name, guild.id);
		}
	});

	// Is it a channel?
	client.channels.forEach(function(channel) {
		if (channel.type == 'dm')
		{
			// Check if channel is specified as 'dm.username' rather than 'dm.username#1234'
			if (('dm.' + channel.recipient.username).toLowerCase() == name)
			{
				table.push('Dm Channel', channel.friendly_name, channel.id);
			}
		}

		if (channel.friendly_name.toLowerCase() == name)
		{
			table.push(
				// Capitalize channel type
				channel.type[0].toUpperCase() + channel.type.slice(1) + ' Channel',
				channel.friendly_name,
				channel.id
			);
		}
	});

	if (options.message.guild)
	{
		// Is it a member (nickname)?
		options.message.guild.members.forEach(function(member) {
			if (member.nickname && member.nickname.toLowerCase() == name)
			{
				table.push('Nickname', member.nickname, member.id);
			}
		});

		// Is it a role?
		options.message.guild.roles.forEach(function(role) {
			if (role.name.toLowerCase() == name)
			{
				table.push('Role', role.name, role.id);
			}
		});
	}

	if (table.length > 1) // First row is header, second row is first result
		return table;
	
	return Discord.code_block('Not found!');
};
