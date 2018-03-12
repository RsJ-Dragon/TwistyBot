module.exports.help = {
	description: 'Show command usage statistics.',
	parameters: '<reset>',
	examples: [
		'',
		'reset'
	]
};

module.exports.params = {
	max: 1,
	check: params => params.length == 0 || params[0] == 'reset'
};

module.exports.permissions = [
	{ user: '*', block: true }
];

module.exports.run = async function(Discord, client, params, options) {
	if (params[0] == 'reset')
	{
		// Reset each command
		client.commands.forEach(command => command.reset_stats());
		// Clear save file
		await client.config.set('commandstats', {});
		return Discord.code_block('Done!');
	}

	// Copy commands array so we don't affect the order of the original array
	let commands = client.commands.slice();

	// Sort alphabetically
	commands.sort( (a,b) => a.name.localeCompare(b.name) );

	// Build the table
	let table = new Discord.Table();
	table.header('Command', 'Uses', 'Errors', 'Avg Time (ms)');
	table.align('lrrr');
	commands.forEach(function(command) {
		let stats = command.stats();
		table.push(
			command.name,
			stats.uses,
			stats.errors,
			stats.average_time_ms == -1 ? '-' : stats.average_time_ms.toFixed(2)
		);
	});

	return table;
};
