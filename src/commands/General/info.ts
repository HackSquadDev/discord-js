import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Formatters, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';

//
const novuURL = 'https://novu.co/';
const tooljetURL = 'https://tooljet.io/';
const dailyDevURL = 'https://daily.dev/';
const hacksquadURL = 'https://hacksquad.dev';
const amplicationURL = 'https://amplication.com/';

//
@ApplyOptions<Command.Options>({
	description: 'Get information about various topics!'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: 'STRING',
					name: 'topic',
					description: 'The topic to get information on',
					required: true,
					choices: [
						{ name: 'HackSquad', value: 'hacksquad' },
						{ name: 'Novu (Sponsor)', value: 'novu' },
						{ name: 'ToolJet (Sponsor)', value: 'tooljet' },
						{ name: 'Daily.dev (Sponsor)', value: 'dailydev' },
						{ name: 'Amplication (Sponsor)', value: 'amplication' }
					]
				}
			]
		});
	}

	// slash command
	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		const currentTopic = interaction.options.get('topic')?.value ?? 'bot';

		switch (currentTopic) {
			case 'hacksquad':
				this.sendHacksquadInfo(interaction);
				return;

			case 'novu':
				this.sendNovuInfo(interaction);
				return;

			case 'amplication':
				this.sendAmplicationInfo(interaction);
				return;

			case 'tooljet':
				this.sendTooljetInfo(interaction);
				return;

			case 'dailydev':
				this.sendDailyDevInfo(interaction);
				return;
		}
	}

	private async sendHacksquadInfo(interaction: Command.ChatInputInteraction) {
		const description = [
			//
			'\u200B',
			'Contribute code, meet community members, participate in workshops, and win more SWAG.',
			Formatters.hyperlink('Click here for more details!', hacksquadURL),
			'\u200B'
		].join('\n');

		//
		const sponsors = [
			`• ${Formatters.hyperlink('Novu.co', novuURL)}`,
			`• ${Formatters.hyperlink('ToolJet', tooljetURL)}`,
			`• ${Formatters.hyperlink('Amplication', amplicationURL)}`,
			`• ${Formatters.hyperlink('Daily.dev', dailyDevURL)}`
		].join('\n');

		//
		const buttons = new MessageActionRow().addComponents([
			new MessageButton().setURL('https://www.hacksquad.dev/#events').setLabel('Events').setStyle('LINK'),
			new MessageButton().setURL('https://www.hacksquad.dev/#qa').setLabel('FAQs').setStyle('LINK'),
			new MessageButton().setURL('https://www.hacksquad.dev/leaderboard').setLabel('Leaderboard').setStyle('LINK')
		]);

		//
		const embed = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({
				name: 'HackSquad 2022',
				iconURL: 'https://www.hacksquad.dev/favicon.png',
				url: hacksquadURL
			})
			.setDescription(description)
			.addFields([
				{
					name: '❯❯ Sponsors',
					value: sponsors,
					inline: false
				}
			])
			.setImage('https://user-images.githubusercontent.com/17677196/190159412-34a1d863-1c2f-49bb-930c-054753137118.jpg')
			.setTimestamp();

		await interaction.reply({ embeds: [embed], components: [buttons] });
	}

	private async sendNovuInfo(interaction: Command.ChatInputInteraction) {
		const description = [
			'\u200B',
			'The ultimate library for managing multi-channel transactional notifications with a single API.',
			'\u200B'
		].join('\n');

		//
		const buttons = new MessageActionRow().addComponents([
			new MessageButton().setURL(novuURL).setLabel('Website').setStyle('LINK'),
			new MessageButton().setURL('https://novu.co/contributors/').setLabel('Heroes').setStyle('LINK'),
			new MessageButton().setURL('https://docs.novu.co/overview/introduction/').setLabel('Documentation').setStyle('LINK')
		]);

		//
		const embed = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({
				name: 'Novu',
				iconURL: 'https://novu.co/favicon-32x32.png',
				url: novuURL
			})
			.setDescription(description)
			.setImage('https://novu.co/images/social-preview.jpg')
			.setTimestamp();

		await interaction.reply({ embeds: [embed], components: [buttons] });
	}

	private async sendAmplicationInfo(interaction: Command.ChatInputInteraction) {
		const description = [
			'\u200B',
			'Amplication is the most flexible open-source platform for Node.js app development. We enable developers to auto-generate production-ready backend in minutes. Design modelsand roles, deploy your app, connect with REST or GraphQL API, sync with GitHub. You own the code.',
			'\u200B'
		].join('\n');

		//
		const buttons = new MessageActionRow().addComponents([
			new MessageButton().setURL(amplicationURL).setLabel('Website').setStyle('LINK'),
			new MessageButton().setURL('https://amplication.com/blog').setLabel('Blog').setStyle('LINK'),
			new MessageButton().setURL('https://docs.amplication.com/docs/').setLabel('Documentation').setStyle('LINK')
		]);

		//
		const embed = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({
				name: 'Amplication',
				iconURL: 'https://avatars.githubusercontent.com/u/65107786',
				url: amplicationURL
			})
			.setDescription(description)
			.setImage('https://raw.githubusercontent.com/amplication/amplication-site/main/public/images/footer_banner.png')
			.setTimestamp();

		await interaction.reply({ embeds: [embed], components: [buttons] });
	}

	private async sendTooljetInfo(interaction: Command.ChatInputInteraction) {
		const description = [
			'\u200B',
			'Open-source low-code framework to build & deploy internal tools, dashboards and business applications in minutes.',
			'\u200B'
		].join('\n');

		//
		const buttons = new MessageActionRow().addComponents([
			new MessageButton().setURL(tooljetURL).setLabel('Website').setStyle('LINK'),
			new MessageButton().setURL('https://blog.tooljet.com/').setLabel('Blog').setStyle('LINK'),
			new MessageButton().setURL('https://docs.tooljet.com/docs/').setLabel('Documentation').setStyle('LINK')
		]);

		//
		const embed = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({
				name: 'ToolJet',
				iconURL: 'https://uploads-ssl.webflow.com/6266634263b9179f76b2236e/626782ee14c06caee011b783_favicon-32x32.png',
				url: tooljetURL
			})
			.setDescription(description)
			.setImage('https://user-images.githubusercontent.com/12490590/165771029-bf490c80-397d-4d3a-8409-0499ccc9b593.gif')
			.setTimestamp();

		await interaction.reply({ embeds: [embed], components: [buttons] });
	}

	private async sendDailyDevInfo(interaction: Command.ChatInputInteraction) {
		const description = ['\u200B', 'daily.dev is the fastest-growing professional platform for developers to grow together.', '\u200B'].join(
			'\n'
		);

		//
		const buttons = new MessageActionRow().addComponents([
			new MessageButton().setURL(dailyDevURL).setLabel('Website').setStyle('LINK'),
			new MessageButton().setURL('https://daily.dev/apps/').setLabel('Apps').setStyle('LINK'),
			new MessageButton().setURL('https://docs.daily.dev/').setLabel('Documentation').setStyle('LINK')
		]);

		//
		const embed = new MessageEmbed()
			.setColor('BLURPLE')
			.setAuthor({
				name: 'Daily.dev',
				iconURL: 'https://uploads-ssl.webflow.com/6266634263b9179f76b2236e/626782ee14c06caee011b783_favicon-32x32.png',
				url: dailyDevURL
			})
			.setDescription(description)
			.setImage('https://daily-now-res.cloudinary.com/image/upload/v1621427800/opengraph/Open_Graph_2.jpg')
			.setTimestamp();

		await interaction.reply({ embeds: [embed], components: [buttons] });
	}
}
