import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageEmbed, Formatters, Message } from 'discord.js';

//
import { createChunk } from '../../lib/utils';
import { getTeamList } from '../../lib/cachedFetch';
import { createPaginationButtons, paginate } from '../../lib/pagination';

import type { ILeaderboardResponse } from '../../lib/types';

//
const winningTeamsCount = 60;

type LeaderboardTeam = ILeaderboardResponse['teams'];

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
		const teams = await getTeamList();

		const pageSize = 5;
		const pages = createChunk(teams, pageSize);

		const pageNumber = (interaction.options.getInteger('page') ?? 1) - 1;

		// If page size is given more than possible length, send the possible page count
		if (!pages[pageNumber]) {
			return interaction.reply({
				content: `❌ | The **HackSquad** leaderboard currently has only ${pages.length} pages!`,
				ephemeral: true
			});
		}

		await interaction.deferReply();

		const buttons = createPaginationButtons();

		const msg = (await interaction.followUp({
			embeds: [this.createLeaderboardEmbed(pages, teams, pageNumber)],
			components: [buttons],
			fetchReply: true
		})) as Message<true>;

		return paginate(
			{
				msg,
				buttons,
				currentPage: pageNumber,
				interaction,
				pages
			},
			async (intr, pageNumber) => {
				await intr.editReply({
					embeds: [this.createLeaderboardEmbed(pages, teams, pageNumber)]
				});
			}
		);
	}

	private createLeaderboardEmbed(pages: LeaderboardTeam[], teams: LeaderboardTeam, pageNumber: number) {
		const currentPage = pages[pageNumber] || pages[0];

		const sourceLink = Formatters.hyperlink('`🔗` **hacksquad.dev**', 'https://www.hacksquad.dev/leaderboard');

		const embed = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({
				name: 'HackSquad Leaderboard',
				url: 'https://www.hacksquad.dev/leaderboard',
				iconURL: 'https://www.hacksquad.dev/favicon.png'
			})
			.setFooter({
				text: `Page ${pageNumber + 1} of ${pages.length}`
			})
			.setDescription(`This data is taken from ${sourceLink}.\n\u200B`)
			.addFields(this.formatTeams(currentPage, teams))
			.setImage('https://user-images.githubusercontent.com/17677196/190159412-34a1d863-1c2f-49bb-930c-054753137118.jpg')
			.setTimestamp();

		return embed;
	}

	private formatTeams(page: LeaderboardTeam, teams: LeaderboardTeam) {
		const formattedTeams = page.map((team) => {
			//
			const squadPos = teams.findIndex((t) => t.id === team.id);
			const squadPosText = `${squadPos + 1}.`.padStart(3, ' ');

			const squadName = Formatters.bold(team.name);
			const squadPoints = Formatters.bold(team.score.toString());

			const squadLink = Formatters.hyperlink(squadName, `https://hacksquad.dev/team/${team.slug}`);
			const squadEmoji = squadPos <= winningTeamsCount ? '`🏆`' : '';

			return {
				name: `${squadPosText} ${squadName} ${squadEmoji}`,
				value: [
					//
					`• \`🔢\` \`Points:\` ${squadPoints}`,
					`• \`🔗\` \`Link:\` ${squadLink}`,
					'\u200B'
				].join('\n')
			};
		});

		return formattedTeams;
	}
}
