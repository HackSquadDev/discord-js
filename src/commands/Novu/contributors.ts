import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageEmbed, Formatters } from 'discord.js';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

//
import { novuApiUrl } from '../../lib/constants';
import type { INovuContributorsResponse } from '../../lib/types';
import { createChunk } from '../../lib/utils';
import { createPaginationButtons, paginate } from '../../lib/pagination';
import type { Message } from 'discord.js';

//
const goldRequirement = 7;
const silverRequirement = 3;
const bronzeRequirement = 1;

//
@ApplyOptions<Command.Options>({
	description: 'Check the list of contributors for Novu.co'
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
					description: 'Page to lookup on the contributor list',
					minValue: 1
				}
			]
		});
	}

	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		const response = await fetch<INovuContributorsResponse>(`${novuApiUrl}/contributors-mini`, FetchResultTypes.JSON);

		// Filtering the contributor list
		const list = response.list
			.filter((contributor) => !contributor.github.includes('bot') && contributor.totalPulls > 0)
			.sort((a, b) => b.totalPulls - a.totalPulls);

		const pageSize = 10;
		const pages = createChunk(list, pageSize);
		const pageNumber = (interaction.options.getInteger('page') ?? 1) - 1;

		// If page size is given more than possible length, send the possible page count
		if (!pages[pageNumber]) {
			return interaction.reply({
				content: `❌ | The **Novu.co** contributor list leaderboard currently has only ${pages.length} pages!`,
				ephemeral: true
			});
		}

		await interaction.deferReply();

		const buttons = createPaginationButtons();
		const msg = (await interaction.followUp({
			embeds: [this.createLeaderboardEmbed(pages, list, pageNumber)],
			components: [buttons],
			fetchReply: true,
			ephemeral: false
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
					embeds: [this.createLeaderboardEmbed(pages, list, pageNumber)]
				});
			}
		);
	}

	private createLeaderboardEmbed(pages: INovuContributorsResponse['list'][], list: INovuContributorsResponse['list'], pageNumber: number) {
		const currentPage = pages[pageNumber] || pages[0];

		const contributorsEmbed = new MessageEmbed()
			.setColor('YELLOW')
			.setAuthor({
				name: 'Novu.co Contributors',
				url: 'https://novu.co/contributors',
				iconURL: 'https://novu.co/favicon-32x32.png'
			})
			.setDescription(`This data is taken from ${Formatters.hyperlink('`🔗` **novu.co**', 'https://novu.co/contributors')}.`)
			.setThumbnail('https://novu.co/icons/icon-512x512.png')
			.setFooter({
				text: `Page ${pageNumber + 1} of ${pages.length}`
			})
			.addFields(this.formatContributorList(currentPage, list));

		return contributorsEmbed;
	}

	private formatContributorList(list: INovuContributorsResponse['list'], team: INovuContributorsResponse['list']) {
		const formattedContributors = list.map((contributor) => {
			//
			const contributorPos = `${team.findIndex((r) => r._id === contributor._id) + 1}.`.padStart(3, ' ');
			const contributorLink = Formatters.hyperlink(contributor.github, `https://github.com/${contributor.github}`);
			const contributorName = Formatters.bold(contributor.name ?? contributor.github);

			//
			const pullCount = contributor.totalPulls ?? 0;
			const totalPulls = Formatters.bold(pullCount?.toString());

			//
			let medalsEmoji = '';
			if (pullCount >= goldRequirement) medalsEmoji = '🥇';
			else if (pullCount >= silverRequirement) medalsEmoji = '🥈';
			else if (pullCount >= bronzeRequirement) medalsEmoji = '🥉';

			const medalsEmojiText = medalsEmoji.length ? `(${medalsEmoji})` : '';

			//
			const descriptionList = {
				name: `${contributorPos} ${contributorName}`,
				value: [`• \`🔢 Total PRs:\` ${totalPulls} ${medalsEmojiText}`, `• \`🌐 Github:\` ${contributorLink}`].join('\n')
			};

			return descriptionList;
		});

		return formattedContributors;
	}
}
