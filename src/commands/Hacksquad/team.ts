import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Formatters, MessageEmbed } from 'discord.js';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

//
import { hackSquadApiUrl } from '../../lib/constants';
import type { ILeaderboardResponse, IPullRequestInfo, ITeamResponse } from '../../lib/types';

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
					required: true
				}
			]
		});
	}

	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.deferReply({ ephemeral: true });

		// Fetching all the teams
		const { teams } = await fetch<ILeaderboardResponse>(`${hackSquadApiUrl}/leaderboard`, FetchResultTypes.JSON);

		const teamInputRaw = interaction.options.getString('name');
		const teamInput = teamInputRaw?.toLowerCase()?.trim() ?? '';

		// Checking if the team actually exists
		const foundTeam = teams.find((team) => team.name.toLowerCase() === teamInput || team.slug.toLowerCase() === teamInput);
		if (!foundTeam) {
			await interaction.editReply(`No team named **${teamInputRaw}** was found! Please double check your input. 🙏`);
			return;
		}

		// Fetching the current team details
		const { team } = await fetch<ITeamResponse>(`${hackSquadApiUrl}/team?id=${foundTeam.slug}`, FetchResultTypes.JSON);

		const pullRequests: IPullRequestInfo[] = JSON.parse(team.prs);

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

		//
		const teamDescriptionArray = [
			`• \`🔢 Points:\` ${teamScoreText}`,
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
				const prEmoji = pr.status === 'DELETED' ? '(`🗑`)' : '';

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
			.setTimestamp();

		await interaction.editReply({ embeds: [teamInfoEmbed] });
	}
}
