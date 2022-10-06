const {
    EmbedBuilder,
    Colors
} = require('discord.js');

module.exports = {
    name: "about",
    description: "Tells you a little bit about the bot.",
    cooldown: "3",
    disabled: false,
    run: async (client, interaction, args) => {
        const aboutUs = new EmbedBuilder()
            .setTitle('About Us')
            .setDescription(`This is something to tell you about us..`)
            .setColor(client.color)
            .setThumbnail(client.logo)
            .setFooter({
                text: client.footer
            });
        return interaction.reply({
            embeds: [aboutUs]
        });
    }
}