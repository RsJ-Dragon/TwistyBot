module.exports.help = {
	description: 'See details about users, guilds, channels, or roles.',
	parameters: '<what>, <specifically>',
	examples: [
		'client',
		'users',
		'user, twisty fork',
		'guilds',
		'guild, twisty-test',
	]
};

module.exports.params = {
	min: 1,
	max: 2
};

module.exports.permissions = [
	{ user: '*', block: true }
];

let format = src_require('lib/format');
module.exports.run = async function(Discord, client, params, options) {
	let what = params[0].toLowerCase();
	let specifically = params[1] ? params[1].toLowerCase() : null;

	switch(what)
	{
		case 'client':
			return Discord.json(examine_client(client));
		case 'users':
		{
			// There could be thousands of users, send the result as a file rather than dozens of messages
			let users_json = JSON.stringify(examine_users(client), null, 2);
			return new Discord.Attachment(Buffer.from(users_json), 'users.txt');
		}
		case 'user':
		{
			// If no user specified, examine the sender
			if (!specifically)
				return Discord.json(examine_user(client, options.message.author, options.message.guild));

			// Check nicknames first
			if (options.message.guild)
			{
				let member = options.message.guild.members.find(function(member) {
					return member.nickname ? member.nickname.toLowerCase() == specifically : false;
				});

				if (member)
					return Discord.json(examine_user(client, member.user, options.message.guild));
			}

			// Not a nickname, check all usernames/tags
			let user = client.users.find(function(user) {
				return (user.username.toLowerCase() == specifically || user.tag.toLowerCase() == specifically || user.id == specifically);
			});

			if (!user)
				return Discord.code_block('User not found!');

			return Discord.json(examine_user(client, user, options.message.guild));
		}
		case 'guilds':
		{
			// There could be hundreds of guilds, send the result as a file rather than dozens of messages
			let guilds_json = JSON.stringify(examine_guilds(client), null, 2);
			return new Discord.Attachment(Buffer.from(guilds_json), 'guilds.txt');
		}
		case 'guild':
		{
			// If no guild specified, examine the current guild
			if (!specifically)
			{
				if (options.message.guild)
					return Discord.json(examine_guild(options.message.guild));
				else
					return Discord.code_block('You must specify a guild!');
			}

			// Find the guild
			let guild = client.guilds.find(function(guild) {
				return (guild.name.toLowerCase() == specifically || guild.id == specifically);
			});

			if (!guild)
				return Discord.code_block('Guild not found!');

			return Discord.json(examine_guild(guild));
		}
		case 'channels':
		{
			// There could be thousands of channels, send the result as a file rather than dozens of messages
			let channels_json = JSON.stringify(examine_channels(client), null, 2);
			return new Discord.Attachment(Buffer.from(channels_json), 'channels.txt');
		}
		case 'channel':
		{
			if (!specifically)
				return Discord.json(examine_channel(options.message.channel));

			// Find the channel
			let channel = client.channels.find(function(channel) {
				return (channel.friendly_name.toLowerCase() == specifically || channel.id == specifically);
			});

			if (!channel)
				return Discord.code_block('Channel not found!');

			return Discord.json(examine_channel(channel));
		}
		default:
			return Discord.code_block('What?');
	}
};

function examine_client(client)
{
	return {
		name: client.user.tag,
		id: client.user.id,
		guilds_cached: client.guilds.size,
		channels_cached: client.channels.size,
		users_cached: client.users.size,
		ping: client.ping,
		status: client.status,
		ready_at: client.readyAt,
		uptime: format.time(client.readyTimestamp)
	};
}

function examine_users(client)
{
	return client.users.array().map(user => user.tag);
}

function examine_user(client, user, guild)
{
	let result = {
		name: user.tag,
		id: user.id,
		bot: user.bot,
		account_age: format.time(user.createdAt),
		servers: client.guilds.filter(g => g.members.has(user.id)).map(g => (
			{
				name: g.name,
				id: g.id,
				nickname: g.members.get(user.id).nickname
			}
		))
	};

	if (guild)
	{
		let member = guild.members.get(user.id);
		if (member)
		{
			result.member_for = format.time(member.joinedAt);
			result.nickname = member.nickname;
			result.permissions = member.permissions.serialize();
		}
	}

	return result;
}

function examine_guilds(client)
{
	return client.guilds.array().map(guild => guild.name);
}

function examine_guild(guild)
{
	// Get all text channels
	let text_channels = {};
	guild.channels
		.filter(channel => channel.type == 'text')
		.forEach(channel => text_channels[channel.name] = channel.id);

	// Get all voice channels
	let voice_channels = {};
	guild.channels
		.filter(channel => channel.type == 'voice')
		.forEach(channel => voice_channels[channel.name] = channel.id);

	return {
		name: guild.name,
		id: guild.id,
		owner: guild.owner.user.tag,
		available: guild.available,
		guild_age: format.time(guild.createdAt),
		member_for: format.time(guild.joinedTimestamp),
		member_count: guild.memberCount,
		features: guild.features,
		text_channels: text_channels,
		voice_channels: voice_channels
	};
}

function examine_channel(channel)
{
	if (channel.type == 'text')
	{
		return {
			type: 'text',
			name: channel.guild.name + '.' + channel.name,
			id: channel.id,
			topic: channel.topic ? channel.topic : undefined
		};
	}
	else if (channel.type == 'dm')
	{
		return {
			type: 'dm',
			recipient: channel.recipient.tag,
			id: channel.id
		};
	}
	else if (channel.type == 'group')
	{
		return{
			type: 'group',
			recipients: channel.recipients.map( user => user.tag ),
			id: channel.id
		};
	}
	else if (channel.type == 'voice')
	{
		return {
			type: 'voice',
			name: channel.guild.name + '.' + channel.name,
			id: channel.id
		};
	}
}

function examine_channels(client)
{
	return client.channels.array().map(channel => channel.friendly_name);
}
