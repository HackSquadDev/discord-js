const {
    EmbedBuilder,
    SelectMenuBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require('discord.js');
const {
    readdirSync
} = require("fs")

module.exports = {
    name: "help",
    description: "Sends you a detailed list of my commands.",
    cooldown: "3",
    disabled: false,
    run: async (client, interaction, args) => {
        
    }
};