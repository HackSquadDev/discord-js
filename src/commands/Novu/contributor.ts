import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Formatters, MessageEmbed } from 'discord.js';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

import fetchItem from 'node-fetch';

//
import { novuApiUrl } from '../../lib/constants';
import { getContributorsList } from '../../lib/cachedFetch';
import type { INovuBadgeResponse, INovuContributorResponse } from '../../lib/types';

//
const goldRequirement = 7;
const silverRequirement = 3;
const bronzeRequirement = 1;

//
@ApplyOptions<Command.Options>({
	description: 'Check the details of a Novu.co contributor'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: 'STRING',
					name: 'username',
					description: 'Name or github username of the contributor to lookup for',
					required: true,
					autocomplete: true
				}
			]
		});
	}

	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.deferReply();

		// Fetching all the contributors
		const contributors = await getContributorsList();

		// Filtering the contributor list
		const list = contributors
			// Removing bots from contributor list
			.filter((contributor) => !contributor.github.includes('bot'))
			// Removing users with no contributions
			.filter((contributor) => contributor?.totalPulls > 0);

		const userInputRaw = interaction.options.getString('username');
		const userInput = userInputRaw?.toLowerCase()?.trim() ?? '';

		// Checking if the team actually exists
		const foundUser = list.find((user) => user.github.toLowerCase() === userInput);
		if (!foundUser) {
			await interaction.editReply(`No contributor found with github ID **${userInputRaw}**! Please double check your input. 🙏`);
			return;
		}

		// Fetching the current team details
		const [contributor, badges] = await Promise.all([
			fetch<INovuContributorResponse>(`${novuApiUrl}/contributor/${foundUser.github}`, FetchResultTypes.JSON),
			fetch<INovuBadgeResponse>(`${novuApiUrl}/badge/${foundUser.github}`, FetchResultTypes.JSON)
		]);

		const specialBadges: any = await fetchItem(`https://novu.co/page-data/contributors/${foundUser.github}/page-data.json`, {
			headers: { 'Content-Type': 'application/json' }
		})
			.then((res) => res.json())
			.catch(() => {});

		//
		const prCount = contributor.totalPulls;
		// const prCountText = Formatters.bold(prCount.toString());

		//
		const githubUrl = Formatters.hyperlink(contributor.github, `https://github.com/${contributor.github}`);
		const twitterUrl = Formatters.hyperlink(contributor.twitter, `https://twitter.com/${contributor.twitter}`);

		//
		const contributorDescriptionArray = [];

		if (contributor.bio) {
			const bioText = Formatters.italic(contributor.bio);

			contributorDescriptionArray.push(`"${bioText}"`, '');
		}

		//
		if (contributor.github) {
			contributorDescriptionArray.push(`• \`ℹ️ Github:\` ${githubUrl}`);
		}

		// NOTE: This is not updated in the API, so not displaying outdated data
		//
		// if (contributor.github_followers) {
		// 	contributorDescriptionArray.push(`   \`↳\` \`Follwers\` - ${contributor.github_followers}`, '');
		// }

		//
		if (contributor.twitter) {
			contributorDescriptionArray.push(`• \`ℹ️ Twitter:\` ${twitterUrl}`);
		}

		// NOTE: This is not updated in the API, so not displaying outdated data
		//
		// if (contributor.twitter_followers) {
		// 	contributorDescriptionArray.push(`   \`↳\` \`Follwers\` - ${contributor.twitter_followers}`, '');
		// }

		contributorDescriptionArray.push('');

		//
		if (contributor.company) {
			contributorDescriptionArray.push(`• \`🏢 Company:\` ${contributor.company}`);
		}

		//
		if (contributor.location) {
			contributorDescriptionArray.push(`• \`🗺 Location:\` ${contributor.location}`);
		}

		//
		if (contributor.url) {
			const websiteUrl =
				contributor.url.startsWith('http://') || contributor.url.startsWith('https://') ? contributor.url : `https://${contributor.url}`;
			contributorDescriptionArray.push(`• \`🌎 Website:\` ${websiteUrl}`);
		}

		//
		if (contributor.last_activity_occurred_at) {
			const lastActivityTime = Formatters.time(Math.floor(new Date(contributor.last_activity_occurred_at).getTime() / 1000));

			contributorDescriptionArray.push('', `• \`🕒 Last Activity at:\` ${lastActivityTime}`);
		}

		//
		const contributorDescription = [...contributorDescriptionArray.filter((itm) => itm !== null), '\u200B'].join('\n');

		//
		const prArray = [];

		//
		if (prCount >= goldRequirement) {
			const goldBadge = badges.pulls.find((badge) => +badge.total === goldRequirement)?.date;
			const goldObtainTime = goldBadge ? Formatters.time(Math.floor(new Date(goldBadge).getTime() / 1000)) : '-';

			prArray.push(`• \`🥇 Gold Medal\` - ${goldObtainTime}`);
		}

		//
		if (prCount >= silverRequirement) {
			const silverBadge = badges.pulls.find((badge) => +badge.total === silverRequirement)?.date;
			const silverObtainTime = silverBadge ? Formatters.time(Math.floor(new Date(silverBadge).getTime() / 1000)) : '-';

			prArray.push(`• \`🥈 Silver Medal\` - ${silverObtainTime}`);
		}

		//
		if (prCount >= bronzeRequirement) {
			const bronzeBadge = badges.pulls.find((badge) => +badge.total === bronzeRequirement)?.date;
			const bronzeObtainTime = bronzeBadge ? Formatters.time(Math.floor(new Date(bronzeBadge).getTime() / 1000)) : '-';

			prArray.push(`• \`🥉 Bronze Medal\` - ${bronzeObtainTime}`);
		}

		//
		const specialAchievements = specialBadges?.result?.data?.wpUserAchievement?.userAchievement?.achievementsList;
		if (specialAchievements?.length) {
			prArray.push('');

			//
			specialAchievements?.forEach((ach: any) => {
				const achDate = Formatters.time(Math.floor(new Date(ach?.achievementDate ?? Date.now()).getTime() / 1000));
				prArray.push(`• \`🌟 ${ach?.achievement?.title}\` - ${achDate}`);
			});
		}

		// Fields to show in embed
		const contributorFields = [];

		if (prArray.length) {
			contributorFields.push({
				name: 'Medals',
				value: [...prArray, '\u200B'].join('\n'),
				inline: false
			});
		}

		if (contributor.pulls.length) {
			const contributorPRs = contributor.pulls
				.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
				.slice(0, 5)
				.map((pr) => {
					const prLink = Formatters.hyperlink(pr.title, pr.html_url);

					return `• ${prLink} (#${Formatters.bold(pr.number.toString())})`;
				});

			contributorFields.push({
				name: `Latest ${Math.min(5, contributor.pulls.length)} Pull Requests`,
				value: [...contributorPRs, '\u200B'].join('\n'),
				inline: false
			});
		}

		//
		const teamInfoEmbed = new MessageEmbed()
			.setColor('YELLOW')
			.setAuthor({
				name: `"${contributor.name ?? contributor.github}" on Novu.co`,
				url: `https://novu.co/contributors/${contributor.github}`,
				iconURL: contributor.avatar_url
			})
			.setDescription(contributorDescription)
			.setFooter({
				text: 'Novu.co',
				iconURL: 'https://novu.co/favicon-32x32.png'
			})
			.addFields(contributorFields)
			.setImage(`https://contributors.novu.co/profiles/${contributor.github}-small.jpg`)
			.setTimestamp();

		await interaction.editReply({ embeds: [teamInfoEmbed] });
	}
}
