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

// RSJ and RW are essentially the same response now, so just use RW's run function
module.exports.run = src_require('commands/General/rw').run;