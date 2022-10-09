import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageEmbed, Formatters } from 'discord.js';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

//
import { hackSquadApiUrl } from '../../lib/constants';
import type { ILeaderboardResponse } from '../../lib/types';

//
const winningTeamsCount = 60;

//
@ApplyOptions<Command.Options>({
	description: 'Check the leaderboard of HackSquad'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: 'INTEGER',
					name: 'page',
					description: 'Page to lookup on the leaderboard',
					minValue: 1
				}
			]
		});
	}

	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		const { teams } = await fetch<ILeaderboardResponse>(`${hackSquadApiUrl}/leaderboard`, FetchResultTypes.JSON);

		const pageSize = 10;
		const pageNumber = (interaction.options.getInteger('page') ?? 1) - 1;

		const pageStart = pageNumber * pageSize;
		const pageEnd = pageStart + pageSize;

		// If page size is given more than possible length, send the possible page count
		if (pageStart > teams.length) {
			return interaction.reply({
				content: `The **HackSquad** leaderboard currently has only ${Math.ceil(teams.length / pageSize)} pages!`,
				ephemeral: true
			});
		}

		// Formatting the message, the UI magic happens right here
		const formattedTeams = teams
			.slice(pageStart, pageEnd)
			.map((team, index) => {
				//
				const squadPos = pageStart + index + 1;
				const squadPosText = `${squadPos}.`.padStart(3, ' ');

				const squadName = Formatters.bold(team.name);
				const squadPoints = Formatters.bold(team.score.toString());

				const squadLink = Formatters.hyperlink(squadName, `https://hacksquad.dev/team/${team.slug}`);
				const squadEmoji = squadPos <= winningTeamsCount ? '`🏆`' : '';

				return [
					`\`${squadPosText}\` ${squadLink} ${squadEmoji}`,
					`   • \`🔢\` \`Points:\` ${squadPoints}`
					//
				].join('\n');
			})
			.join('\n\n');

		const leaderboardEmbed = new MessageEmbed()
			.setColor('RED')
			.setAuthor({
				name: 'HackSquad Leaderboard',
				url: 'https://www.hacksquad.dev/leaderboard',
				iconURL: 'https://www.hacksquad.dev/favicon.png'
			})
			.setDescription(formattedTeams);

		await interaction.reply({ embeds: [leaderboardEmbed] });
	}
}
