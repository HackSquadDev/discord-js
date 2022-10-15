import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Formatters, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'A little background story about the bot'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	// slash command
	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.deferReply({ fetchReply: true });

		//
		const description = [
			//
			'\u200B',
			'The bot was initially started as a mini-challenge during the HackSquad event where the discord bots would be built up in different languages.',
			'As a result of which the idea of this bot was introduced and executed finally.',
			'',
			'The bot aims to provide userful information about the HackSquad event and also the peripheral around it.',
			'',
			'The bot has been a success only thanks to the contribution from the community.',
			`A huge thanks to ${Formatters.hyperlink('all the contributors', 'https://github.com/HackSquadDev/discord-js/graphs/contributors')} 🙏`,
			'',
			'The bot is licensed under **MIT License**, so you guys are more than welcome to contribute to the bot or use the codebase.',
			'\u200B'
		].join('\n');

		//
		const buttons = new MessageActionRow().addComponents([
			new MessageButton().setLabel('Source code').setURL('https://github.com/HackSquadDev/discord-js').setStyle('LINK'),
			new MessageButton().setLabel('Contributors').setURL('https://github.com/HackSquadDev/discord-js/graphs/contributors').setStyle('LINK')
		]);

		//
		const embed = new MessageEmbed()
			.setTitle('About the bot!')
			.setColor('BLURPLE')
			.setDescription(description)
			.addFields([
				{
					name: '❯❯ Tech Stack',
					value: [
						`• ${Formatters.hyperlink('TypeScript', 'https://www.typescriptlang.org/')}`,
						`• ${Formatters.hyperlink('Discord.js', 'https://discord.js.org/#/')}`,
						`• ${Formatters.hyperlink('Sapphire', 'https://www.sapphirejs.dev/')}`,
						'\u200B'
					].join('\n')
				}
			])
			.setImage('https://user-images.githubusercontent.com/17677196/190159412-34a1d863-1c2f-49bb-930c-054753137118.jpg')
			.setTimestamp();

		//
		return await interaction.followUp({ embeds: [embed], components: [buttons] });
	}
}
