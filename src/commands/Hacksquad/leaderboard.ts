import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageEmbed, Formatters, Message } from 'discord.js';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

//
import { hackSquadApiUrl } from '../../lib/constants';
import type { ILeaderboardResponse } from '../../lib/types';
import { createChunk } from '../../lib/utils';
import { createPaginationButtons, paginate } from '../../lib/pagination';

//
const winningTeamsCount = 60;

type LeaderboardTeam = Pick<ILeaderboardResponse, 'teams'>['teams'];

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

		const embed = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({
				name: 'HackSquad Leaderboard',
				url: 'https://www.hacksquad.dev/leaderboard',
				iconURL: 'https://www.hacksquad.dev/favicon.png'
			})
			.setThumbnail('https://www.hacksquad.dev/favicon.png')
			.setFooter({
				text: `Page ${pageNumber + 1} of ${pages.length}`
			})
			.setDescription(`This data is taken from ${Formatters.hyperlink('`🔗` **hacksquad.dev**', 'https://www.hacksquad.dev/leaderboard')}.`)
			.addFields(this.formatTeams(currentPage, teams));

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
				value: [`• \`🔢\` \`Points:\` ${squadPoints}`, `• \`🔗\` \`Link:\` ${squadLink}`].join('\n')
			};
		});

		return formattedTeams;
	}
}
