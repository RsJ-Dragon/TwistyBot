module.exports.help = {
	description: 'Display OldSchool player forum profile.',
	parameters: '<username>',
	examples: [
		'Twisty Fork',
		'Vegakargdon'
	]
};

module.exports.params = {
	max: 1
};

module.exports.permissions = [
	// TNT, Nibss, Cepp, jumanji
	// { user: ['122427034109476866', '227476163507912705', '211178579034243072', '158678282232004608'], allow: true },
	{ user: '*', block: true }
];

let RuneScape = src_require('apis/RuneScape');
let format = src_require('lib/format');

module.exports.run = async function(Discord, client, params, options) {
	let profile = await RuneScape.forum_profile(params[0]);

	if (!profile)
		return Discord.code_block('Player not found!');

	if (profile.postcount == 0)
		return Discord.code_block('No posts found for ' + params[0]);

	// Build an embed to showcase their profile
	let embed = new Discord.RichEmbed();
	embed.setColor(options.message.guild ? options.message.guild.me.displayColor : 0x87CEEB);
	embed.setAuthor('Player: ' + profile.name, profile.avatar, profile.link);

	let description = 'Player has made ' + profile.postcount + ' posts.';

	// RichEmbeds have a limit of 25 fields
	if (profile.posts.length > 25)
	{
		description += '\nShowing the most recent 25 posts.';
		profile.posts = profile.posts.slice(0, 25);
	}
	embed.setDescription(description);

	profile.posts.forEach(function(post) {
		embed.addField(post.section, '[' + format.time(post.date) + ' ago] ' + Discord.masked_link(post.thread, post.showuser_link));
	});

	return embed;
};
