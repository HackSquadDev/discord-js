const {
    EmbedBuilder,
    Colors,
    version
} = require('discord.js');
const mongoose = require('mongoose');
const {
    time
} = require('@discordjs/builders');

module.exports = {
    name: "stats",
    description: "Display the bot stats.",
    cooldown: "3",
    disabled: false,
    run: async (client, interaction, args) => {
        const botvalue = (Date.now() / 1000 - client.uptime / 1000).toFixed(0);
        const aboutUs = new EmbedBuilder()
            .setTitle('Bot - Stats')
            .addFields( {
                name: `Created On:`,
                value: `${time(client.user.createdAt, 'R')}`
            }, {
                name: `Bot Latency:`,
                value: `${client.ws.ping}ms`
            }, {
                name: `Bot Uptime:`,
                value: `<t:${botvalue}:R>`
            }, {
                name: `Mongoose:`,
                value: `v${mongoose.version}`
            }, {
                name: `Discord.js:`,
                value: `v${version}`
            }, {
                name: `Node:`,
                value: `v${process.versions.node}`
            })
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