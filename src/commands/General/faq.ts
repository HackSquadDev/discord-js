import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Formatters, MessageEmbed } from 'discord.js';
import { faqList } from '../../lib/faqData';

//
@ApplyOptions<Command.Options>({
	description: 'You got some question? We might already have the answer!'
})
export class FaqCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: 'STRING',
					name: 'question',
					description: 'The question you are willing to ask',
					required: true,
					autocomplete: true
				}
			]
		});
	}

	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.deferReply();

		//
		const question = interaction.options.getString('question', true);

		// Checking if the question actually exists
		const foundQuestion = faqList.find((faq) => faq.question.toLowerCase() === question.toLowerCase());
		if (!foundQuestion) {
			await interaction.editReply(
				`It seems we don't have any answer to your question "**${question}**" yet!\nPlease share your question and ping our team, we will get back to you as soon as possible.`
			);
			return;
		}

		//
		const questionStr = Formatters.bold(foundQuestion.question);
		const answerStr = foundQuestion.answer;

		//
		const teamInfoEmbed = new MessageEmbed()
			.setColor('YELLOW')
			.setDescription([questionStr, '', answerStr].join('\n'))
			.setFooter({
				text: 'HackSuqad',
				iconURL: 'https://www.hacksquad.dev/favicon.png'
			})
			.setImage('https://user-images.githubusercontent.com/17677196/190159412-34a1d863-1c2f-49bb-930c-054753137118.jpg')
			.setTimestamp();

		await interaction.editReply({ embeds: [teamInfoEmbed] });
	}
}
