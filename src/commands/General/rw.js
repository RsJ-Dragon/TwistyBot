module.exports.help = {
	description: 'Lookup a player on RuneWatch and RSJustice.',
	parameters: '<username1>, <username2>, ...',
	details:
		'Both current and previous names are checked for matches. Usernames must be separated with commas. ' +
		'If you see a blank message from this command, you may have embeds disabled. Enable them at Settings->Text & Images->Link Preview.',
	examples: [
		'cempy',
		'yente, tades, schlitz',
	]
};

module.exports.params = {
	min: 1
};

module.exports.permissions = [];

let Discord = require('discord.js');
let RuneWatch = src_require('apis/RuneWatch');
let RSJustice = src_require('apis/RSJustice');
let format = src_require('lib/format');
let moment = require('moment-timezone');

const dateformat = 'MMMM D, YYYY';

const private_users = [
	'217934790886686730', // Twisty Fork
	'99213910405578752',  // Dragon
	'212267001161187328', // Veq
];

const private_channels = [
	'230201497302859776', // RS JUSTICE.clan-leaders
	'309255385750175747', // RS JUSTICE.private-name-checks
];

const leaving_soon =
	'RSJustice and RuneWatch are merging, as a result RsJ-Bot will be shutting down permanently. ' +
	'TwistyBot will continue to provide the !rsj/rw commands. TwistyBot can be invited to your server using the following link:\n' +
	Discord.link('https://discordapp.com/oauth2/authorize?client_id=228019028755611648&permissions=0&scope=bot') +
	'\nJoin the RuneWatch Discord for more information: https://discordapp.com/invite/YcW6wq ';

const leaving_soon_have_twistybot =
	'RSJustice and RuneWatch are merging, as a result RsJ-Bot will be shutting down permanently. ' +
	'TwistyBot will continue to provide the !rsj/rw commands.' +
	'\nJoin the RuneWatch Discord for more information: https://discordapp.com/invite/YcW6wq ';

module.exports.run = async function(Discord, client, params, options) {
	let message = options.message.guild && options.message.guild.members.has('228019028755611648') ? leaving_soon_have_twistybot : leaving_soon;

	// Which posts do we care about?
	let rw_statuses = ['publish'];
	let rsj_statuses = ['publish'];

	// Is it a special user?
	if (private_users.includes(options.message.author.id))
	{
		rsj_statuses.push('private');
	}

	// Is it a special channel?
	if (private_channels.includes(options.message.channel.id))
	{
		rsj_statuses.push('private');
	}

	if (params.length == 1)
	{
		// Single name lookup
		let rw_posts = RuneWatch.search(params[0], rw_statuses);
		let rsj_posts = RSJustice.search(params[0], rsj_statuses);
		
		// Combine results and sort by score
		let posts = rw_posts.concat(rsj_posts).sort( (a, b) => a.score - b.score );
		if (posts.length == 0)
			return 'Player not found!\n' + message;
		
		let exact_matches = posts.filter(post => post.score == 0);
		let close_matches = posts.filter(post => post.score > 0);

		// Remove duplicates from close match list
		close_matches = close_matches.filter(function(m1, index) {
			// Duplicates are same name and same site
			return index == close_matches.findIndex(m2 => m1.search_name == m2.search_name && m1.post.site == m2.post.site);
		});

		// Format response
		if (options.embeds)
		{
			// Tricky, multiple embeds could be returned here
			let response = embed_response(exact_matches, close_matches, options);
			if (response.length > 1)
				response.unshift(message);
			else
				response = { content: message, options: response[0] };
			return response;
		}
		else
			return text_response(exact_matches, close_matches) + '\n' + message;
	}
	else
	{
		// Multi name lookup, just find exact matches for each
		let response = '';
		for(let name of params)
		{
			// Find RW cases for this name
			RuneWatch.search(name, rw_statuses, true).forEach(function(match)
			{
				response += name + ': ' + Discord.link(match.post.url) + '\n';
			});
			// Find RSJ cases for this  name
			RSJustice.search(name, rsj_statuses, true).forEach(function(match)
			{
				response += name + ': ' + Discord.link(match.post.url) + '\n';
			});
		}

		return (response || 'No matching cases found!') + '\n' + message;
	}
};

function embed_response(exact_matches, close_matches, options)
{	
	// Convert exact matches to embeds
	let response = exact_matches.map(function(match) {
		if (match.post.site == 'RW')
			return runewatch_post_embed(match.post, options);
		else if (match.post.site == 'RSJ')
			return rsjustice_post_embed(match.post, options);
	});

	// If there are any close matches, append another message listing them
	if (close_matches.length > 0)
	{
		response.push(
			'Here are some close matches:\n'
			+ Discord.code_block(close_matches.map(match => match.post.site + ': ' + match.name ).join('\n') )
		);
	}

	return response;
}

function runewatch_post_embed(post, options)
{
	let embed = new Discord.RichEmbed();
	if (options.files)
	{
		// embed.attachFile('./assets/runewatch.png');
		// embed.setThumbnail('attachment://runewatch.png');
		embed.setThumbnail('https://i.imgur.com/hilVaDv.png');
	}
	embed.setColor(options.message.guild ? options.message.guild.me.displayColor : 0x87CEEB);
	embed.setAuthor(post.player);
	embed.setDescription(post.reason);

	// Details
	let details = '';

	details += '• Date published - ' + moment(post.date_created).format(dateformat) + ' (' + format.time(post.date_created) + ' ago)\n';
	details += '• Last updated - ' + moment(post.date_modified).format(dateformat) + ' (' + format.time(post.date_modified) + ' ago)\n';
	if (post.evidence_quality)
	{
		details += '• Evidence quality - ' + post.evidence_quality;
		switch (post.evidence_quality)
		{
			case '★★★★★':
				details += ' (Irrefutable)';
				break;
			case '★★★★☆':
				details += ' (Very strong)';
				break;
			case '★★★☆☆':
				details += ' (Good)';
				break;
			case '★★☆☆☆':
				details += ' (Some)';
				break;
			case '★☆☆☆☆':
				details += ' (Very little)';
				break;
			default:
				details += '(?)';
		}
	}

	embed.addField('Details:', details);

	// Previous names
	if (post.previous_names.length > 0)
		embed.addField('Previous names:', '• ' + post.previous_names.join('\n• '));

	// Link
	embed.addField('Link:', post.url);

	// Debug
	if (options.message.guild && options.message.guild.id == '232274245848137728')
	{
		embed.addField('Status:', post.status, true);
		embed.addField('ID:', post.id, true);
	}
	return embed;
}

function rsjustice_post_embed(post, options)
{
	let embed = new Discord.RichEmbed();
	if (options.files)
	{
		// embed.attachFile('./assets/rsjustice.png');
		// embed.setThumbnail('attachment://rsjustice.png');
		embed.setThumbnail('https://i.imgur.com/s06GgpD.png');
	}
	embed.setColor(options.message.guild ? options.message.guild.me.displayColor : 0x87CEEB);
	embed.setAuthor(post.reason ? post.player + ' - ' + post.reason : post.player);
	if (post.custom.excerpt)
		embed.setDescription(post.custom.excerpt[0]);

	let case_details = '';
	// Accused names
	case_details += '• Current name - ' + post.player + '\n';
	if (post.custom.NATA)
		case_details += '• Name at time of abuse - ' + post.custom.NATA[0] + '\n';
	if (post.previous_names.length)
		case_details += '• Previous names - ' + post.previous_names.join(', ') + '\n';
	embed.addField('Accused Player:', case_details);

	// Dates
	case_details = '';
	if (post.custom.date)
	{
		let actual_date = moment(post.custom.date[0], 'YYYY/MM/DD');
		if (actual_date.isValid())
			case_details += '• Date of abuse - ' + actual_date.format(dateformat) + ' (' + format.time(actual_date.toDate(), new Date()) + ' ago)\n';
		else
			case_details += '• Date of abuse - ' + post.custom.date[0] + '\n';
	}
	case_details += '• Date published - ' + moment(post.date_created).format(dateformat) + ' (' + format.time(post.date_created, new Date()) + ' ago)\n';
	case_details += '• Last updated - ' + moment(post.date_modified).format(dateformat) + ' (' + format.time(post.date_modified, new Date()) + ' ago)';

	embed.addField('Timeline:', case_details);

	case_details = '';
	if (post.custom.clan)
		case_details += '• Clan - ' + post.custom.clan.join(',') + '\n';
	if (post.custom.author)
		case_details += '• Author - ' + post.custom.author.join(',') + '\n';
	if (post.custom.victim)
		case_details += '• Victims - ' + post.custom.victim.join(',') + '\n';
	case_details += '• Status - ' + (post.status == 'publish' ? 'public' : post.status) + '\n';
	if (options.message.guild && options.message.guild.id == '232274245848137728')
		case_details += '• ID - ' + post.id + '\n';

	case_details += '\n\n' + post.url;

	embed.addField('Other Details:', case_details);

	return embed;
}

function text_response(exact_matches, close_matches)
{
	let response = 'Give me permission to embed links for fancy responses!';
	if (exact_matches.length > 0)
	{
		response += '\n\nHere are players currently or previously known by that name:';
		exact_matches.forEach(function(match) {
			let reason = match.post.reason;
			if (!reason && match.post.custom && match.post.custom.excerpt)
				reason = match.post.custom.excerpt[0];
			response += '\n' + Discord.bold(match.post.player) + ' - ' + reason +
				'\n  ' + Discord.link(match.post.url);
		});
	}
	if (close_matches.length > 0)
	{
		response += '\n\nHere are some close matches:\n' +
			Discord.code_block(close_matches.map(match => match.post.site + ': ' + match.name).join('\n'));
	}
	return response;
}