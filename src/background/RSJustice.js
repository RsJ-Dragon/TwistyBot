let RSJustice = src_require('apis/RSJustice');
let Discord = require('discord.js');

class live_feed
{
	constructor(client, channel_id)
	{
		this.client = client;
		this.channel_id = channel_id;
		this.embed = new Discord.RichEmbed();
	}

	// Add another field to embed
	// Send if embed is full or wait 1 second for more fields to come in
	queue(title, text)
	{
		console.log('queue' + title);
		if (this.timeout)
			clearTimeout(this.timeout);
		this.embed.addField(title, text);
		if (this.embed.fields.length >= 25)
			this.send();
		else
			this.timeout = setTimeout(this.send.bind(this), 1000);
	}

	send()
	{
		if (this.embed.fields.length == 0)
			return;
		let channel = this.client.channels.get(this.channel_id);
		if (!channel)
		{
			console.error('RSJustice livefeed could not get livefeed channel!');
			return;
		}
		this.embed.setColor(channel.guild ? channel.guild.me.displayColor : 0x87CEEB);
		channel.send({ embed: this.embed });
		this.embed = new Discord.RichEmbed();
	}
}

module.exports = async function(client) {
	let cache_promise = RSJustice.init_cache();

	// Setup live feed
	// live ? RS Justice.public-chat : Twisty-Test.feed
	let public_feed_id = config.live ? '230095268354326528' : '307622004607942656';
	let public_feed = new live_feed(client, public_feed_id);
	// Listen for post events
	RSJustice.on('new_publish', function(new_post)
	{
		public_feed.queue('New post: ' + new_post.player, new_post.url + '\n' + new_post.reason);
	});
	RSJustice.on('modify_publish', function(new_post, old_post)
	{
		if (new_post.player != old_post.player)
		{
			public_feed.queue('Name changed: ' + old_post.player + ' ⟹ ' + new_post.player, new_post.url + '\n' + new_post.reason);
		}
		if (new_post.status != old_post.status)
		{ // Consider it a new post if status changed from anything->publish
			public_feed.queue('New post: ' + new_post.player, new_post.url + '\n' + new_post.reason);
		}
	});

	// live ? RS Justice.live-feed : Twisty-Test.feed
	let private_feed_id = config.live ? '309719645365993479' : '307622004607942656';
	let private_feed = new live_feed(client, private_feed_id);
	// Listen for post events
	RSJustice.on('new_pending', function(new_post)
	{
		private_feed.queue('New post (pending): ' + new_post.player, new_post.reason);
	});
	RSJustice.on('new_private', function(new_post)
	{
		private_feed.queue('New post (private): ' + new_post.player, new_post.url + '\n' + new_post.reason);
	});
	RSJustice.on('modify_private', function(new_post, old_post)
	{
		if (new_post.player != old_post.player)
		{
			private_feed.queue(`Name changed (${new_post.status}: ${old_post.player} ⟹ ${new_post.player}`, new_post.url + '\n' + new_post.reason);
		}
		if (new_post.status != old_post.status)
		{
			private_feed.queue(`Status changed (${old_post.status} ⟹ ${new_post.status}): ${new_post.player}`,
				new_post.url + '\n' + new_post.reason);
		}
	});

	// If faststart is defined, don't wait for RSJ cache to load
	return config.faststart ? Promise.resolve() : cache_promise;
};
