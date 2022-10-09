import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageEmbed, Formatters } from 'discord.js';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

//
import { novuApiUrl } from '../../lib/constants';
import type { INovuContributorsResponse } from '../../lib/types';

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
			// Removing bots from contributor list
			.filter((contributor) => !contributor.github.includes('bot'))
			// Removing users with no contributions
			.filter((contributor) => contributor?.totalPulls > 0);

		const pageSize = 10;
		const pageNumber = (interaction.options.getInteger('page') ?? 1) - 1;

		const pageStart = pageNumber * pageSize;
		const pageEnd = pageStart + pageSize;

		// If page size is given more than possible length, send the possible page count
		if (pageStart > list.length) {
			return interaction.reply({
				content: `The **Novu.co** contributor list currently has only ${Math.ceil(list.length / pageSize)} pages!`,
				ephemeral: true
			});
		}

		// Formatting the message, the UI magic happens right here
		const formattedContributors = list
			.sort((a, b) => b.totalPulls - a.totalPulls)
			.slice(pageStart, pageEnd)
			.map((contributor, index) => {
				//
				const contributorPos = `${pageStart + index + 1}.`.padStart(3, ' ');
				const contributorLink = Formatters.hyperlink(contributor.github, `https://github.com/${contributor.github}`);
				const contributorName = Formatters.bold(contributor.name ?? contributor.github);

				//
				const pullCount = contributor.totalPulls ?? 0;
				const totalPulls = Formatters.bold(pullCount?.toString());

				//
				const medalsEmoji = [];
				if (pullCount >= goldRequirement) medalsEmoji.push('🥇');
				else if (pullCount >= silverRequirement) medalsEmoji.push('🥈');
				else if (pullCount >= bronzeRequirement) medalsEmoji.push('🥉');

				const medalsEmojiText = medalsEmoji.length ? `(${medalsEmoji.join(' ')})` : '';

				//
				const descriptionList = [
					`\`${contributorPos}\` ${contributorName}`,
					`   • \`🔢 Total PRs:\` ${totalPulls} ${medalsEmojiText}`,
					`   • \`🌐 Github:\` ${contributorLink}`
				];

				return descriptionList.join('\n');
			})
			.join('\n\n');

		//
		const contributorsEmbed = new MessageEmbed()
			.setColor('YELLOW')
			.setAuthor({
				name: 'Novu.co Contributors',
				url: 'https://novu.co/contributors/',
				iconURL: 'https://novu.co/favicon-32x32.png'
			})
			.setDescription(formattedContributors);

		await interaction.reply({ embeds: [contributorsEmbed] });
	}
}
