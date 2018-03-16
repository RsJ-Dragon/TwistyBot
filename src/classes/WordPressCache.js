let EventEmitter = require('events');
let moment = require('moment-timezone');
let fuzzy_match = src_require('lib/fuzzy_match');
let RateLimiter = src_require('classes/RateLimiter');

function searchable(name)
{
	return name.replace(/[-_\xa0]/g, ' ').toLowerCase();
}

class WordPressCache extends EventEmitter
{
	constructor(config)
	{
		super();

		// API base url
		this.url = config.url;
		// API password
		this.password = config.password;

		// Request rate limiter
		this.limiter = new RateLimiter(8000, 8000);

		// Time of most recent post
		this.last_update = moment(0);

		/*
			posts[id] => site specific post object
		*/
		this.posts = {};
				
		/*
			players[]
				.name
				.post => site specific post object
		*/
		this.players = [];
	}

	// Download posts from server and convert them to post objects
	async get_posts(options)
	{
		options.url = this.url,
		options.qs = options.qs || {};
		options.qs.password = this.password;

		let res = await this.limiter.queue(options);
		return JSON.parse(res.body).map(this.convert.bind(this));
	}

	// Download posts and save them in the caches
	async save_posts(options, emit_events)
	{
		let self = this;
		let posts = await this.get_posts(options);

		// Filter posts that didn't change
		posts = posts.filter(function(new_post) {
			// Get the last known version
			let old_post = self.posts[new_post.id];

			// WordPress has a granularity of 1 second for date queries and searching and
			// post queries for after: date include posts made at that date, so we need to filter
			// posts modified at the same time as the version we already know about
			if (old_post && old_post.date_modified.getTime() == new_post.date_modified.getTime())
			{
				return false;
			}

			return true;
		});

		if (posts.length == 0)
			return 0;

		// Update cache
		posts.forEach(function(new_post) {
			// Get the last known version
			let old_post = self.posts[new_post.id];

			// Cache new post
			self.posts[new_post.id] = new_post;

			// Check if this post is newer than the most recent post we know of
			if (new_post.date_modified > self.last_update)
				self.last_update = moment(new_post.date_modified);

			// Launch events
			if (emit_events)
			{
				if (old_post)
					self.emit('modify_' + new_post.status, new_post, old_post);
				else
					self.emit('new_' + new_post.status, new_post, old_post);
			}
		});

		// Rebuild player names array
		this.players = [];

		// Insert current names first
		for(let id in this.posts)
		{
			let post = this.posts[id];
			this.players.push(
				{
					name: post.player,
					search_name: searchable(post.player),
					post: post
				}
			);
		}

		// Insert previous names last
		for (let id in this.posts)
		{
			let post = this.posts[id];
			for(let name of post.previous_names)
			{
				this.players.push(
					{
						name: name,
						search_name: searchable(name),
						post: post
					}
				);
			}
		}

		console.log('Cached ' + posts.length + ' posts');
		return posts.length;
	}

	/*
		Search posts
		result[]
			.name
			.search_name
			.score
			.post
	*/
	search(name, statuses, exact = false)
	{
		name = searchable(name);

		// Filter posts by status
		let players = this.players.filter(player => statuses.includes(player.post.status));

		if (exact)
		{
			// Only return exact matches
			players = players.filter(player => player.search_name == name);
			return players.map(player => (
				{
					name: player.name,
					search_name: player.search_name,
					score: 0,
					post: player.post
				}
			));
		}
		else
		{
			// Filter names that are too long or too short
			players = players.filter(player => player.search_name.length < name.length + 3 && player.search_name.length > name.length - 3);
			
			// Get a sorted list of closest matches to name in names
			let fuzz_result = fuzzy_match(
				name,
				players,
				{ // weights
					insert: 10,
					multiple_insert: 10,
					delete: 12,
				},
				p => p.search_name // Converter
			);

			
			// Filter names that aren't relatively close
			let score_limit = name.length < 5 ? 30 : 10 + 5 * name.length;
			fuzz_result = fuzz_result.filter(e => e.score < score_limit);

			// Map fuzzy_match result to { score, post }
			return fuzz_result.map(match => (
				{
					name: match.element.name,
					search_name: match.element.search_name,
					score: match.score,
					post: match.element.post
				}
			));
		}
	}
}

module.exports = WordPressCache;