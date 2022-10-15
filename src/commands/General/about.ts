import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Formatters, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { exec } from 'child_process';

const GITHUB_URL = 'https://github.com/HackSquadDev/discord-js';

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

	private getLastCommits() {
		return new Promise<string | null>((resolve) => {
			exec('git log --oneline -3', (err, stdout) => {
				if (err) return resolve(null);
				const commits = stdout
					.split('\n')
					.map((m) => {
						const [commit, ...message] = m.split(' ');
						if (!commit) return '';
						const link = Formatters.hyperlink(`\`${commit}\``, `${GITHUB_URL}/commit/${commit}`);
						return `${link} ${message.join(' ')}`;
					})
					.filter((r) => r.trim().length > 0)
					.join('\n');
				return resolve(commits);
			});
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
			`A huge thanks to ${Formatters.hyperlink('all the contributors', `${GITHUB_URL}/graphs/contributors`)} 🙏`,
			'',
			'The bot is licensed under **MIT License**, so you guys are more than welcome to contribute to the bot or use the codebase.',
			'\u200B'
		].join('\n');

		//
		const buttons = new MessageActionRow().addComponents([
			new MessageButton().setLabel('Source code').setURL(GITHUB_URL).setStyle('LINK'),
			new MessageButton().setLabel('Contributors').setURL(`${GITHUB_URL}/graphs/contributors`).setStyle('LINK'),
			new MessageButton().setLabel('View Commits').setURL(`${GITHUB_URL}/commits`).setStyle('LINK')
		]);

		//

		const fields = [
			{
				name: '❯❯ Tech Stack',
				value: [
					`• ${Formatters.hyperlink('TypeScript', 'https://www.typescriptlang.org/')}`,
					`• ${Formatters.hyperlink('Discord.js', 'https://discord.js.org/#/')}`,
					`• ${Formatters.hyperlink('Sapphire', 'https://www.sapphirejs.dev/')}`,
					'\u200B'
				].join('\n')
			}
		];

		const commits = await this.getLastCommits();
		if (commits)
			fields.push({
				name: `Last 3 Commits`,
				value: commits
			});

		const embed = new MessageEmbed()
			.setTitle('About the bot!')
			.setColor('BLURPLE')
			.setDescription(description)
			.addFields(fields)
			.setImage('https://user-images.githubusercontent.com/17677196/190159412-34a1d863-1c2f-49bb-930c-054753137118.jpg')
			.setTimestamp();

		//
		return await interaction.followUp({ embeds: [embed], components: [buttons] });
	}
}
