const {
    EmbedBuilder,
    Colors
} = require('discord.js');

module.exports.run = async (client, message) => {
    try {
        if (message.author.bot) return;
        if (!message.guild) return;
        var prefix = client.config.bot.prefix;
        const mention = new RegExp(`^<@!?${client.user.id}>( |)$`);
        if (message.content.match(mention)) {
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'How can i help you?'
                })
                .setColor(client.color)
                //.setThumbnail(client.logo)
                .setDescription('You seem a little lost!')
                .addFields([{
                        name: 'My Prefix:',
                        value: `\`${prefix}\` || \`@Mention\``
                    },
                    {
                        name: 'Help Command:',
                        value: `\`${prefix}help\` || \`@Mention help\``
                    },
                ])
                .setFooter({
                    text: client.footer
                });
            return message.reply({
                embeds: [embed]
            });
        }
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const prefixRegex = new RegExp(
            `^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`,
        );
        if (!prefixRegex.test(message.content)) return;
        const [matchedPrefix] = message.content.match(prefixRegex);
        const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command =
            client.commands.get(commandName) ||
            client.commands.find(
                (cmd) => cmd.aliases && cmd.aliases.includes(commandName),
            );
        if (!command) return;
        if (command) {
            if (command.help.disabled === true) {
                const disabledCmds = new EmbedBuilder()
                    .setDescription(`${command.help.name} is currently disabled.`)
                    .setColor(Colors.Red)
                    .setFooter({
                        text: client.footer
                    });
                return message.reply({
                    embeds: [disabledCmds]
                });
            }
            if (!args[0] && command.help.args) {
                const noArgs = new EmbedBuilder()
                let reply = `You didn\'t provide any arguments`;
                if (command.help.usage) {
                    reply += `\nUsage: \`${prefix}${command.help.name} ${command.help.usage}\``;
                }
                noArgs.setDescription(reply)
                .setColor(Colors.Red)
                    .setFooter({
                        text: client.footer
                    });
                return message.reply({
                    embeds: [noArgs]
                });
            }
            if (command.help.permissions && !message.member.permissions.has(command.help.permissions || [])) {
                const disabledCmds = new EmbedBuilder()
                    .setDescription(`You need \`${command.help.permissions.join(', ')}\` permissions to execute ${command.help.name}.`)
                    .setColor(Colors.Red)
                    .setFooter({
                        text: client.footer
                    });
                return message.reply({
                    embeds: [disabledCmds]
                });
            }
            if (command.help.admins === true && !client.config.admins.includes(message.author.id)) {
                const notAdmin = new EmbedBuilder()
                    .setDescription(`${command.help.name} is limited to admins only.`)
                    .setColor(Colors.Red)
                    .setFooter({
                        text: client.footer
                    });
                return message.reply({
                    embeds: [notAdmin]
                });
            }
            if (command.help.staff === true && !client.config.staff.includes(message.author.id)) {
                const notAdmin = new EmbedBuilder()
                    .setDescription(`${command.help.name} is limited to staff only.`)
                    .setColor(Colors.Red)
                    .setFooter({
                        text: client.footer
                    });
                return message.reply({
                    embeds: [notAdmin]
                });
            }
            if (!client.config.staff.includes(message.author.id)) {
                if (!cooldowns.has(command.help.name)) {
                    cooldowns.set(command.help.name, new client.cooldowns);
                }
                const now = Date.now();
                const timestamps = client.cooldowns.get(command.help.name);
                const cooldownAmount = Math.floor(command.help.cooldown || 5) * 1000;
                if (!timestamps.has(message.author.id)) {
                    timestamps.set(message.author.id, now);
                    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
                } else {
                    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
                    const timeLeft = (expirationTime - now) / 1000;
                    if (now < expirationTime && timeLeft > 0.9) {
                        const cooldown = new EmbedBuilder()
                            .setDescription(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.help.name}\` command.`)
                            .setColor(Colors.Red)
                            .setFooter({
                                text: client.footer
                            })
                        return message.reply({
                            embeds: [cooldown]
                        });
                    }
                    timestamps.set(message.author.id, now);
                    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
                }
            }
            try {
                command.run(client, message, args);
            } catch (err) {
                console.error(error)
                //await Console.sendLogs(`${err.stack}`, 'error');
                // const cmdError = new EmbedBuilder()
                //     .setDescription(`An error has occured while executing ${command.help.name}, This has been reported to our developers.`)
                //     .setColor("RED")
                //     .setFooter({
                //         text: client.footer
                //     });
                // message.reply({
                //     embeds: [cmdError]
                // });
                // //
                // const errorChannel = client.channels.cache.find(chan => chan.id === "") || null;
                // const cmdError2 = new EmbedBuilder()
                //     .setDescription(`\`\`\`yaml\n${err.stack}\`\`\``)
                //     .setColor("RED")
                //     .setTimestamp()
                //     .setFooter({
                //         text: client.footer
                //     });
                // return errorChannel.send({
                //     embeds: [cmdError2]
                // });
            }
        }
    } catch (error) {
        // await Console.sendLogs(`${err.stack}`, 'error');
        // const errorChannel = client.channels.cache.find(chan => chan.id === "") || null;
        // const cmdError2 = new EmbedBuilder()
        //     .setDescription(`\`\`\`yaml\n${err.stack}\`\`\``)
        //     .setColor("RED")
        //     .setTimestamp()
        //     .setFooter({
        //         text: client.footer
        //     });
        // return errorChannel.send({
        //     embeds: [cmdError2]
        // });
        console.error(error)
    }
}