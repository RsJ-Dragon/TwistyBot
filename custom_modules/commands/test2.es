const Discord = require('discord.js');
module.exports = async function(message, params) {
	var e = new Discord.RichEmbed();
	e.setAuthor('Twisty Fork', message.author.avatarURL, 'http://pngimg.com/upload/spoon_PNG3043.png');
	e.addField('field1', 'value1', true);
	e.addField('field2', 'value2', true);
	e.addField('field3', 'value3', true);
	e.addField('field4', 'value4', false);
	e.setColor(0xFFFFFF);
	e.setDescription('description');
	e.setFooter('footer', 'http://pngimg.com/upload/spoon_PNG3043.png');
	e.setTitle('title');
	e.setThumbnail('http://pngimg.com/upload/spoon_PNG3043.png'); // Add picture in top right
	e.setImage('http://pngimg.com/upload/spoon_PNG3043.png'); // Full size image after fields, before footer
	e.setTimestamp(new Date());
	e.setURL('http://pngimg.com/upload/spoon_PNG3043.png'); // Add link to title
	message.channel.sendEmbed(e, 'embed test');

	console.log(message.author);
 //You can put [masked links](http://google.com) inside of rich embeds.


};