/*
	post
		.site
		.id
		.url
		.player
		.reason
		.custom
		.date_created
		.date_modified
		.status
		.previous_names
*/

let WordPressCache = src_require('classes/WordPressCache');
let entities = require('entities');
let RateLimiter = src_require('classes/RateLimiter');

class RSJustice extends WordPressCache
{
	constructor(config)
	{
		super(config);
		this.limiter = new RateLimiter(1000, 8000);
	}

	// Convert the raw API data to a post object
	convert(raw)
	{
		// Build post object
		let post = {
			site: 'RSJ',
			id: raw.id,
			url: this.url.replace(/wp-json.+/, raw.link),
			player: entities.decodeHTML(raw.title),
			reason: entities.decodeHTML(raw.reason),
			custom: raw.custom,
			date_created: new Date(raw.date + 'Z'),
			date_modified: new Date(raw.modified + 'Z'),
			status: raw.status,
			previous_names: raw.tags.filter(t => t != raw.title)
		};

		if (post.custom)
		{
			// Decode entities in custom attributes
			for (let k in post.custom)
			{
				post.custom[k] = post.custom[k].map(html => entities.decodeHTML(html));
			}
		}

		return post;
	}

	// To be called on bot startup
	async init_cache()
	{
		let options = {
			qs: {
				order: 'ASC',
				orderby: 'ID',
				page: 1,
				posts_per_page: 500
			},
			retries: 99,
		};

		// Keep loading the next page as long as we get 500 posts on the current page
		let count = 500;
		while(count == 500)
		{
			count = await this.save_posts(options);
			options.qs.page += 1;
		}

		// All posts have been loaded, start a timer to update the cache every 5 minutes
		// let self = this;
		// setInterval(
		// 	function() {
		// 		// Get posts after the latest post in our cache
		// 		let options = {
		// 			qs: {
		// 				after: self.last_update.tz('UTC').format('YYYY-MM-DD HH:mm:ss')
		// 			}
		// 		};

		// 		self.save_posts(options, true).catch(e => console.warn('RSJ update error', e));
		// 	}, 300000);
	}
}

module.exports = new RSJustice( config.get('rsjustice') );
