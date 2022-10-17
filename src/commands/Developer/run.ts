import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { MessageActionRow, Modal, TextInputComponent, ModalActionRowComponent } from 'discord.js';
import { paren, parseJSON } from '../../lib/utils';

@ApplyOptions<Command.Options>({
	description: 'Run arbitrary code'
})
export class RunCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					name: 'language',
					description: 'The programming language to use',
					type: 'STRING',
					autocomplete: true,
					required: true
				}
			]
		});
	}

	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		const lang = interaction.options.getString('language', true);
		const langInfo = parseJSON<{
			language: string;
			runtime?: string;
			version: string;
		}>(lang);

		const codeInput = new TextInputComponent()
			.setStyle('PARAGRAPH')
			.setLabel('Source Code')
			.setRequired(true)
			.setPlaceholder('Example: console.log("Hello World!");')
			.setCustomId('source_code');

		const fileName = new TextInputComponent()
			.setStyle('SHORT')
			.setLabel('File Name')
			.setRequired(false)
			.setPlaceholder('Example: index.js')
			.setCustomId('source_file');

		const argumentsList = new TextInputComponent()
			.setStyle('SHORT')
			.setLabel('Arguments (Comma Separated)')
			.setRequired(false)
			.setPlaceholder('Example: 1,2,3')
			.setCustomId('args');

		const stdin = new TextInputComponent()
			.setStyle('SHORT')
			.setLabel('Standard Input')
			.setRequired(false)
			.setPlaceholder('Example: 1,2,3')
			.setCustomId('stdin');

		const inputFields = [codeInput, fileName, argumentsList, stdin].map((m) => {
			return new MessageActionRow<ModalActionRowComponent>().addComponents(m);
		});

		const heading = langInfo ? `Code Runner for ${langInfo.language} ${langInfo.runtime ? paren(langInfo.runtime) : ''}` : 'Code Runner';
		const modal = new Modal()
			.setTitle(heading.trim())
			.setCustomId(`code_runner-${lang}`)
			.addComponents(...inputFields);

		await interaction.showModal(modal);
	}
}
