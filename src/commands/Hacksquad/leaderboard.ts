import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageEmbed, Formatters, MessageActionRow, MessageButton, Message, InteractionReplyOptions } from 'discord.js';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

//
import { hackSquadApiUrl } from '../../lib/constants';
import type { ILeaderboardResponse } from '../../lib/types';

//
const winningTeamsCount = 60;

type LeaderboardTeam = Pick<ILeaderboardResponse, 'teams'>['teams'];

//
@ApplyOptions<Command.Options>({
	description: 'Check the leaderboard of HackSquad'
})
export class UserCommand extends Command {
	private $currentPage = 0;
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
		await interaction.deferReply();
		const { teams } = await fetch<ILeaderboardResponse>(`${hackSquadApiUrl}/leaderboard`, FetchResultTypes.JSON);

		const pageSize = 10;
		const pages = this.createChunk(teams, pageSize);
		const pageNumber = (interaction.options.getInteger('page') ?? 1) - 1;

		// If page size is given more than possible length, send the possible page count
		if (!pages[pageNumber]) {
			return interaction.followUp({
				content: `The **HackSquad** leaderboard currently has only ${pages.length} pages!`,
				ephemeral: true
			});
		}

		this.$currentPage = pageNumber;

		const buttons = this.createPaginationButtons();
		const msg = (await interaction.followUp({
			embeds: [this.createLeaderboardEmbed(pages, teams, pageNumber)],
			components: [buttons],
			fetchReply: true
		})) as Message<true>;

		const collector = msg.createMessageComponentCollector({
			componentType: 'BUTTON',
			filter: (m) => m.message.id === msg.id && buttons.components.some((r) => r.customId === m.customId)
		});

		collector.on('collect', async (intr) => {
			if (interaction.replied) return;
			if (interaction.user.id !== intr.user.id) {
				const err = {
					embeds: [
						{
							title: '❌ Permission Error',
							description: `Only ${interaction.user.toString()} is allowed to use this button.`,
							color: 'RED'
						}
					]
				} as InteractionReplyOptions;
				if (interaction.deferred) return void (await interaction.followUp(err));
				return void (await interaction.reply(err));
			}

			switch (intr.customId) {
				case 'left':
					{
						collector.resetTimer();
						await intr.deferUpdate();
						this.$currentPage = this.$currentPage - 1 < 0 ? pages.length - 1 : this.$currentPage - 1;
						await intr.editReply({
							embeds: [this.createLeaderboardEmbed(pages, teams, this.$currentPage)]
						});
					}
					break;
				case 'right':
					{
						collector.resetTimer();
						await intr.deferUpdate();
						this.$currentPage = this.$currentPage + 1 >= pages.length ? 0 : this.$currentPage + 1;
						await intr.editReply({
							embeds: [this.createLeaderboardEmbed(pages, teams, this.$currentPage)]
						});
					}
					break;
				case 'close':
					{
						if (intr.message.deletable) await intr.message.delete().catch(() => null);
						collector.stop();
					}
					break;
			}

			return;
		});

		collector.once('end', async () => {
			if (msg.editable) {
				msg.components.forEach((m) => m.components.map((n) => n.setDisabled(true)));
				await msg.edit({ components: msg.components }).catch(() => null);
			}
		});

		return;
	}

	private createLeaderboardEmbed(pages: LeaderboardTeam[], teams: LeaderboardTeam, pageNumber: number) {
		const $currentPage = pages[pageNumber] || pages[0];

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
			.setDescription(this.formatTeams($currentPage, teams));

		return embed;
	}

	private createPaginationButtons() {
		const leftButton = new MessageButton({
			customId: 'left',
			emoji: '⬅️',
			style: 'PRIMARY'
		});
		const rightButton = new MessageButton({
			customId: 'right',
			emoji: '➡️',
			style: 'PRIMARY'
		});
		const closeButton = new MessageButton({
			customId: 'close',
			emoji: '✖️',
			style: 'DANGER'
		});

		const row = new MessageActionRow().addComponents([leftButton, closeButton, rightButton]);

		return row;
	}

	private formatTeams(page: LeaderboardTeam, teams: LeaderboardTeam) {
		const formattedTeams = page
			.map((team) => {
				//
				const squadPos = teams.findIndex((t) => t.id === team.id);
				const squadPosText = `${squadPos + 1}.`.padStart(3, ' ');

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

		return formattedTeams;
	}

	private createChunk<T>(arr: T[], len: number): T[][] {
		const chunks: T[][] = [];

		for (let i = 0; i < arr.length; i += len) {
			chunks.push(arr.slice(i, i + len));
		}

		return chunks;
	}
}
