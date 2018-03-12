let common = require('../common');
let cheerio = require('cheerio');
let moment = require('moment-timezone');

/*
	result
		.name
		.link
		.avatar
		.posts[]
			.section
			.qfc
			.thread
			.date
			.thread_link
			.showuser_link
		.postcount

*/
module.exports = async function(player_name) {
	const forum_base = 'http://services.runescape.com/m=forum/';

	let res = await common.limiter.queue({
		url: forum_base + 'users.ws',
		qs: {
			// Replace &nbsp with space and remove invalid characters
			searchname: player_name.replace(/\xa0/g, ' ').replace(/[^a-zA-Z0-9 \-_]/g, ''),
			lookup: 'view'
		},
		encoding: 'ascii' // Required
	});

	let $ = cheerio.load(res.body);

	// Search input is blank if the player has no profile or is not a real player
	if ($('#searchname').val() == '')
	{
		let error = $('#forums--userview > div > div.contents > main > p').text();
		if (error.includes('invalid username'))
			return null; // Not a real player

		// Else, it is a real player, who has simply made no posts
		return {
			name: player_name,
			link: res.request.url.href,
			avatar: 'http://services.runescape.com/m=avatar-rs/' + encodeURIComponent(player_name) + '/chat.png',
			posts: [],
			postcount: 0
		};
	}

	// Extract their posts
	let posts = [];
	$('#forums--userview > div > div.contents > main > section.threads-list > article').each(function(i, e) {
		posts.push({
			section: $(e).find('div.thread-plate__details > p > a.thread-plate__forum-name').text(),
			qfc: $(e).find('div.thread-plate__details > p > a.thread-plate__qfc').text(),
			thread: $(e).find('div.thread-plate__details > h3 > a').text(),
			date: moment.tz($(e).find('a.thread-plate__last-posted').text(), 'DD-MMM-YYYY HH:mm:ss', 'Europe/London').toDate(),
			thread_link: forum_base + $(e).find('div.thread-plate__details > h3 > a').attr('href'),
			showuser_link: forum_base + $(e).find('a.thread-plate__post-by-user').attr('href').replace('%A0','%20'),
		});
	});

	// Sort posts from newest to oldest
	posts = posts.sort( (a,b) => b.date - a.date );

	// Jmod profiles might not contain post count
	let postcount_match = $('#forums--userview > div > div.contents > main > p').text().match(/\d+/);

	return {
		name: $('#searchname').val(),
		link: res.request.url.href,
		avatar: 'http://services.runescape.com/m=avatar-rs/' + encodeURIComponent(player_name) + '/chat.png',
		posts: posts,
		postcount: postcount_match ? parseInt(postcount_match[0]) : -1
	};
};
