const {
    EmbedBuilder,
    ActivityType
} = require('discord.js');

module.exports.run = async (client, message, args) => {
    try {
        let status = `Discord.JS! || ${client.config.bot.prefix}help`
        client.user.setActivity(status, {
            type: ActivityType.Watching
        });
        console.log(`Bots is now online!`)
    } catch (error) {
        console.error(error)
    }
}