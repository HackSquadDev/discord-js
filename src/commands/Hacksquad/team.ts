import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Formatters, MessageEmbed, MessageActionRow, MessageButton, Message, EmbedFieldData } from 'discord.js';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

//
import { getTeamList } from '../../lib/cachedFetch';
import { hackSquadApiUrl } from '../../lib/constants';
import type { IPullRequestInfo, ITeamResponse } from '../../lib/types';
import { createPaginationButtons, paginate } from '../../lib/pagination';
import { chunk } from '@sapphire/utilities';

//
const squadSizeMax = 5;
const winningTeams = 60;

//
@ApplyOptions<Command.Options>({
	description: 'Check the details of a team registered in HackSquad'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: 'STRING',
					name: 'name',
					description: 'Name or Slug of the team to lookup for',
					required: true,
					autocomplete: true
				},
				{
					type: 'BOOLEAN',
					name: 'prs',
					description: 'Show pull requests made by this team',
					required: false
				}
			]
		});
	}

	public async pullRequestsSub(team: ITeamResponse["team"], pullRequests: IPullRequestInfo[], interaction: Command.ChatInputInteraction) {
		const prList = chunk(pullRequests
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.map((pr, idx) => {
				const prLink = Formatters.hyperlink(Formatters.bold(`\`#${pr.id}\``), pr.url);
				const prEmoji = pr.status === 'DELETED' ? '`❌`' : '';

				return {
					name: `${++idx}. ${pr.title}`,
					value: `${prLink} ${prEmoji}\n**Created** <t:${Math.floor(new Date(pr.createdAt).getTime() / 1000)}:R>\n\u200B`
				} as EmbedFieldData;
			}), 10);
		
		const buttons = createPaginationButtons();

		const msg = (await interaction.followUp({
			embeds: [this.createPRSEmbed(prList, team, 0)],
			components: [buttons],
			fetchReply: true
		})) as Message<true>;

		return paginate(
			{
				msg,
				buttons,
				currentPage: 0,
				interaction,
				pages: prList
			},
			async (intr, pageNumber) => {
				await intr.editReply({
					embeds: [this.createPRSEmbed(prList, team, pageNumber)]
				});
			}
		);
	}

	public createPRSEmbed(pages: EmbedFieldData[][], team: ITeamResponse["team"], page: number) {
		const currentPage = pages[page] || pages[0];

		const embed = new MessageEmbed()
			.setTitle(`Pull Requests by ${team.name}`)
			.setDescription("\u200B")
			.setURL(`https://hacksquad.dev/team/${team.slug}`)
			.addFields(currentPage)
			.setColor("BLURPLE")
			.setFooter({
				text: `Page ${page + 1} of ${pages.length}`
			})
			.setImage('https://user-images.githubusercontent.com/17677196/190159412-34a1d863-1c2f-49bb-930c-054753137118.jpg')
			.setTimestamp();

		return embed;
	}

	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		// Fetching all the teams
		const teams = await getTeamList();
		
		const teamInputRaw = interaction.options.getString('name', true);
		const teamInput = teamInputRaw.toLowerCase().trim();
		
		// Checking if the team actually exists
		const foundTeam = teams.find((team) => team.name.toLowerCase() === teamInput || team.slug.toLowerCase() === teamInput);
		if (!foundTeam) {
			await interaction.reply({
				content: `No team named **${teamInputRaw}** was found! Please double check your input. 🙏`,
				ephemeral: true
			});
			return;
		}
		
		await interaction.deferReply();
		// Fetching the current team details
		const { team } = await fetch<ITeamResponse>(`${hackSquadApiUrl}/team?id=${foundTeam.slug}`, FetchResultTypes.JSON);

		const pullRequests: IPullRequestInfo[] = JSON.parse(team.prs);

		if (interaction.options.getBoolean('prs')) {
			return this.pullRequestsSub(team, pullRequests, interaction);
		}

		//
		const teamScoreText = Formatters.bold(team.score.toString());
		const teamSizeText = Formatters.bold(team.users.length.toString());
		const teamSizeInfo = Formatters.italic(
			team.users.length === squadSizeMax ? 'A complete squad!' : team.users.length === 1 ? 'Lonely User' : 'Growing squad!'
		);

		//
		const teamPosition = teams.findIndex((itm) => itm.id === team.id) + 1;
		const teamPositionText = Formatters.bold(teamPosition.toString());
		const teamPositionEmoji = teamPosition <= winningTeams ? '`🏆`' : '';

		//
		const invalidPRCount = pullRequests.filter((pr) => pr.status === 'DELETED').length;
		const totalPRCountText = Formatters.bold(pullRequests.length.toString());
		const invalidPRCountText = Formatters.bold(invalidPRCount.toString());

		//
		const teamAutoAssignStr = Formatters.bold('Welcoming new members');
		const teamDisqualifiedStr = Formatters.bold('Disqualified');

		//
		const invalidPREmoji =
			pullRequests.length === 0 ? '' : invalidPRCount === 0 ? '`👌`' : invalidPRCount < 5 ? '`🙂`' : invalidPRCount < 15 ? '`😓`' : '`😔`';

		const teamBonus = team.score - (pullRequests.length - invalidPRCount);
		const teamBonusText = teamBonus > 0 ? `(${Formatters.italic(teamBonus.toString())} bonus points)` : '';

		//
		const teamDescriptionArray = [
			'\u200B',
			`• \`🔢 Points:\` ${teamScoreText} ${teamBonusText}`,
			`• \`🏅 Position:\` ${teamPositionText} (out of ${teams.length}) ${teamPositionEmoji}`,
			`• \`👥 Members Count:\` ${teamSizeText} (${teamSizeInfo})`,
			'',
			`• \`🔢 Total PRs:\` ${totalPRCountText}`,
			`• \`🛑 Invalid PRs:\` ${invalidPRCountText} ${invalidPREmoji}`,
			'\u200B'
		];

		//
		if (team.allowAutoAssign && !team.disqualified) {
			teamDescriptionArray.push(`• ${teamAutoAssignStr} 🙌`);
		}

		//
		if (team.disqualified) {
			teamDescriptionArray.push(`• ${teamDisqualifiedStr} 😔`);
		}

		//
		const _membersList = team.users
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
			.map((user, index) => {
				const memberGithubLink = Formatters.hyperlink(Formatters.bold(user.name), `https://github.com/${user.handle}`);
				const ownerEmoji = team.ownerId === user.id ? '(`👑`)' : '';

				return `\`${index + 1}.\` ${memberGithubLink} ${ownerEmoji}`;
			});

		const membersList = [..._membersList, '\u200B'].join('\n');

		//
		const _last5PRList = pullRequests
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 5)
			.map((pr) => {
				const prLink = Formatters.hyperlink(Formatters.bold(pr.title), pr.url);
				const prEmoji = pr.status === 'DELETED' ? '`❌`' : '';

				return `\`-\` ${prLink} ${prEmoji}`;
			});

		const last5PRList = [..._last5PRList, '\u200B'].join('\n');

		//
		const teamDescription = teamDescriptionArray.join('\n');

		// Fields to show in embed
		const teamFields = [{ name: 'Members `👥`', value: membersList, inline: false }];

		//
		if (pullRequests.length) {
			teamFields.push({ name: `Latest ${Math.min(5, pullRequests.length)} Pull Requests`, value: last5PRList, inline: false });
		}

		//
		const teamInfoEmbed = new MessageEmbed()
			.setColor('RED')
			.setAuthor({
				name: `"${team.name}" on HackSquad`,
				url: `https://hacksquad.dev/team/${team.slug}`
			})
			.setDescription(teamDescription)
			.setFooter({
				text: 'HackSuqad',
				iconURL: 'https://www.hacksquad.dev/favicon.png'
			})
			.addFields(teamFields)
			.setImage('https://user-images.githubusercontent.com/17677196/190159412-34a1d863-1c2f-49bb-930c-054753137118.jpg')
			.setTimestamp();

		const actionRow = new MessageActionRow();
		actionRow.addComponents(
			new MessageButton().setEmoji('🌐').setStyle('LINK').setURL(`https://hacksquad.dev/team/${team.slug}`).setLabel('View Team')
		);

		await interaction.followUp({ embeds: [teamInfoEmbed], components: [actionRow] });
	}
}
