
// Data sources
var get_clan_list = custom_require('report/sources/clan_list');
var get_clan_hiscores = custom_require('report/sources/rshiscores');
var get_clan_rsjustice = custom_require('report/sources/rsjustice');

// Report sections
var find_inactive = custom_require('report/sections/inactives');
var find_rsjustice = custom_require('report/sections/rsjustice');
var find_missing = custom_require('report/sections/missing');
var find_cb_changed = custom_require('report/sections/cb_changed');
var find_xp_gains = custom_require('report/sections/xp_gains');

// https://docs.google.com/spreadsheets/d/1N2fzS9Bd_BZ7EwzWbS8YRDGQipIo8DCDlHYmJUEmXAs/edit#gid=0
var dateformat = require('dateformat');

// Set up to automatically run at 1am every night
var CronJob = require('cron').CronJob;
// sec min hours day month dayofwk
var job = new CronJob('00 0 */4 * * *', update_report, null, true);



module.exports = async function(params)
{
	if (params[0] == 'update')
		await update_report();

	var report = await load_report_data();

	console.log('Formatting report...');
	var report_str = 'Report time: ' + dateformat(report.end_date, 'mmm d, h:ss TT')
		+ '\n\n' + find_inactive(report.clan_list)
		+ '\n\n' + find_rsjustice(report.clan_list)
		+ '\n\n' + find_cb_changed(report.clan_list)
		+ '\n\n' + find_missing(report.clan_list)
		+ '\n\n' + find_xp_gains(report.clan_list);

	return report_str;
}

async function update_report()
{
	console.log('Begin report update...');
	var report = {start_date: Date.now()};
	report.clan_list = await get_clan_list(); //75,4
	// Load all data
	await Promise.all([
		get_clan_hiscores(report.clan_list),
		get_clan_rsjustice(report.clan_list),
	]);
	report.end_date = Date.now();

	await util.save_json_file(global.server_directory + '/storage/latest_report.json', report);
	console.log('Report ready.');
}

async function load_report_data()
{
	var report = await util.load_json_file(global.server_directory + '/storage/latest_report.json', []);
	var hiscores_history = await database.query('SELECT * FROM hiscores_history');
	var players = await database.query('SELECT * FROM players');
	for(var i = 0; i < report.clan_list.length; i++)
	{
		var member = report.clan_list[i];
		// Find player_id for this member
		var player = players.find( p => p.name.toLowerCase() == member.name.toLowerCase() );
		if (!player)
		{
			console.log('Could not find player id for', member.name);
			continue;
		}
		// Extract history entries for this player
		member.history = [];
		hiscores_history.forEach(function(row) {
			if (row.player_id == player.id)
			{
				row.hiscores = JSON.parse(row.hiscores);
				member.history.push(row);
			}
		});
	}
	return report;
}

// Leftover code to load old history files into database
async function load_history_file(clan_list) {
	var history = await util.load_json_file(global.server_directory + '/storage/player_history.json');
	if (!history.length)
	{
		console.warn('History not found. Giving up.');
		return;
	}

	for(var i = 0; i < clan_list.length; i++)
	{
		var member = clan_list[i];
		// Members who changed their name will lose their history
		var name = member.name.toLowerCase();
		var hist = history.find( e => e.name.toLowerCase() == name);
		if (hist)
		{
			await database.query('INSERT INTO hiscores_history SET ' +
				'player_id = (SELECT id FROM players WHERE name = ? LIMIT 1), ' +
				'timestamp = ?, hiscores = ?;', member.name, hist.last_seen, JSON.stringify(hist.rshiscores));
		}
	}
};

// TODO:
// Search forum posts
// Search for level ups (99s?)
