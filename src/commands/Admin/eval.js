module.exports.help = {
	description: 'Evaluate code with access to bot data.',
	parameters: '<code>',
	details: ''
};

module.exports.params = {
	parser: 'raw'
};

module.exports.permissions = [
	{ user: '*', block: true }
];

const vm = require('vm');
let sandbox;
module.exports.run = async function(Discord, client, params, options) {
	if (!sandbox)
	{
		sandbox = {
			require: src_require,
			globals: global,
			Discord: Discord,
			client: client,
			options: options
		};
		sandbox = vm.createContext(sandbox);
	}
	try
	{
		let answer = vm.runInContext(params, sandbox, { timeout: 500 });

		// JSON.stringify chokes on NaN
		if (Number.isNaN(answer))
			return Discord.code_block('NaN');

		// Don't return absurdly long results
		if (typeof answer === 'string' && answer.length > 1980)
			answer = answer.slice(0, 1980) + '...';

		return Discord.json(answer);
	} catch(e) {
		if (e instanceof SyntaxError)
		{ // Retrieve what the syntax error was
			let details = e.stack.split('\n').slice(1,3).join('\n');
			return Discord.code_block('Script SyntaxError: ' + e.message + '\n' +  details);
		}
		return Discord.code_block('Script Error: ' + e.message);
	}
};
