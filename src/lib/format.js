module.exports = {
	int: function(value) {
		return parseInt(value).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
	},

	float: function(value, num_decimals) {
		return parseFloat(value).toLocaleString('en', { minimumFractionDigits: num_decimals, maximumFractionDigits: num_decimals });
	},

	// Returns approximate time between two dates eg "3 weeks"
	time: function(t1 = new Date(), t2 = new Date()) {
		const one_second = 1000;
		const one_minute = 60 * one_second;
		const one_hour = 60 * one_minute;
		const one_day = 24 * one_hour;
		const one_week = 7 * one_day;

		if (typeof t1 === 'number')
			t1 = new Date(t1);
		if (typeof t2 === 'number')
			t2 = new Date(t2);

		if (t1 > t2)
		{ // swap so t1 is always the earlier date
			let tmp = t2;
			t2 = t1;
			t1 = tmp;
		}

		// Caclulate number of months based on the starting date
		// Jan 3rd to March 4th = 3 months
		// Jan 3rd to March 1st = 2 months
		let elapsed_months =
			(t2.getUTCMonth() + t2.getUTCFullYear() * 12) -
			(t1.getUTCMonth() + t1.getUTCFullYear() * 12);
		if (t1.getUTCDate() > t2.getUTCDate())
		{
			elapsed_months = elapsed_months - 1;
		}

		if (elapsed_months > 48)
			return Math.floor(elapsed_months / 12) + ' years';

		if (elapsed_months > 4)
			return elapsed_months + ' months';

		let milliseconds = t2 - t1;
		if (milliseconds > 2 * one_week)
			return Math.floor(milliseconds / one_week) + ' weeks';
		if (milliseconds > 2 * one_day)
			return Math.floor(milliseconds / one_day) + ' days';
		if (milliseconds > 2 * one_hour)
			return Math.floor(milliseconds / one_hour) + ' hours';
		if (milliseconds > 2 * one_minute)
			return Math.floor(milliseconds / one_minute) + ' minutes';
		// else
		return Math.floor(milliseconds / one_second) + ' seconds';
	},

	titleCase(str) {
		return str.replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
	},

	// Source: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript?page=2&tab=votes#tab-top
	titleCaseComplex(str) {
		const articles = ['a', 'an', 'the'];
		const conjunctions = ['for', 'and', 'nor', 'but', 'or', 'yet', 'so'];
		const prepositions = [
			'with', 'at', 'from', 'into', 'upon', 'of', 'to', 'in', 'for',
			'on', 'by', 'like', 'over', 'plus', 'but', 'up', 'down', 'off', 'near'
		];

		// The list of spacial characters can be tweaked here
		const replaceCharsWithSpace = (str) => str.replace(/[^0-9a-z&/\\]/gi, ' ').replace(/(\s\s+)/gi, ' ');
		const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.substr(1);
		const normalizeStr = (str) => str.toLowerCase().trim();
		const shouldCapitalize = (word, fullWordList, posWithinStr) => {
			if ((posWithinStr == 0) || (posWithinStr == fullWordList.length - 1))
			{
				return true;
			}

			return !(articles.includes(word) || conjunctions.includes(word) || prepositions.includes(word));
		};

		str = replaceCharsWithSpace(str);
		str = normalizeStr(str);

		let words = str.split(' ');
		if (words.length <= 2)
		{ // Strings less than 3 words long should always have first words capitalized
			words = words.map(w => capitalizeFirstLetter(w));
		}
		else
		{
			for (let i = 0; i < words.length; i++)
			{
				words[i] = (shouldCapitalize(words[i], words, i) ? capitalizeFirstLetter(words[i], words, i) : words[i]);
			}
		}

		return words.join(' ');
	}
};
