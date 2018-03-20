/*
	post
		.site
		.id
		.url
		.player
		.reason
		.evidence_quality
		.date_created
		.date_modified
		.status
		.previous_names
*/

let WordPressCache = src_require('classes/WordPressCache');
let entities = require('entities');

class RuneWatch extends WordPressCache
{
	constructor(config)
	{
		super(config);
	}

	// Convert the raw API data to a post object
	convert(raw)
	{
		// Build post object
		let post = {
			site: 'RW',
			id: raw.id,
			url: this.url.replace(/wp-json.+/, raw.link),
			player: entities.decodeHTML(raw.title),
			reason: entities.decodeHTML(raw.reason),
			evidence_quality: '',
			date_created: new Date(raw.date + 'Z'),
			date_modified: new Date(raw.modified + 'Z'),
			status: raw.status,
			previous_names: raw.tags.filter(t => t != raw.title)
		};

		// Extract evidence quality from post reason
		let match = post.reason.match(/^([^★☆]+)([★☆]{5})\s*$/);
		if (match)
		{
			post.reason = match[1].trim();
			post.evidence_quality = match[2];
		}

		return post;
	}

	// To be called on bot startup
	async init_cache()
	{
		await this.save_posts({
			qs: {
				after: '1970-01-01 00:00:00'
			},
			retries: 99
		});

		// All posts have been loaded, start a timer to update the cache every 5 minutes
		let self = this;
		setInterval(
			function ()
			{
				// Get posts after the latest post in our cache
				let options = {
					qs: {
						after: self.last_update.tz('UTC').format('YYYY-MM-DD HH:mm:ss')
					}
				};

				// Save posts and emit events
				self.save_posts(options).catch(e => console.warn('RSJ update error', e));
			}, 300000);
	}
}

module.exports = new RuneWatch( config.get('runewatch') );
