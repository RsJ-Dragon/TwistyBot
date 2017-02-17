var Discord = require('discord.js');


// Helpers for finding channels
Discord.Client.prototype.get_text_channel = require('./get_text_channel.js');
Discord.Client.prototype.get_dm_channel = require('./get_dm_channel.js');
Discord.Client.prototype.get_user = require('./get_user.js');

// Return channel name
Discord.Channel.prototype.get_name = require('./get_channel_name.js');

// Custom logic for breaking up large messages
Discord.TextChannel.prototype.sendmsg = require('./sendmsg.js');
Discord.DMChannel.prototype.sendmsg = require('./sendmsg.js');
Discord.GroupDMChannel.prototype.sendmsg = require('./sendmsg.js');

// Helper to evaluate permissions objects against a message
Discord.Message.prototype.check_permissions = require('./check_permissions.js');

// Discord Markdown
// https://support.discordapp.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-
Discord.italics                = function(text) { return '*' + text + '*'; };
Discord.bold                   = function(text) { return '**' + text + '**'; };
Discord.bold_italics           = function(text) { return '***' + text + '***'; };
Discord.strikeout              = function(text) { return '~~' + text + '~~'; };
Discord.underline              = function(text) { return '__' + text + '__'; };
Discord.underline_italics      = function(text) { return '__*' + text + '*__'; };
Discord.underline_bold         = function(text) { return '__**' + text + '**__'; };
Discord.underline_bold_italics = function(text) { return '__***' + text + '***__'; };
Discord.code_block             = function(text) { return '```' + text + '```'; };
Discord.inline_code            = function(text) { return '`' + text + '`'; };

module.exports = Discord;
global.Discord = Discord;