import type { InteractionReplyOptions, ModalSubmitInteraction } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';

import { MessageEmbed, Formatters } from 'discord.js';

import { executeCode, getRuntimes } from '../../lib/cachedFetch';
import type { ICodeExecutionErrorResult, ICodeExecutionOptions, ICodeExecutionResult } from '../../lib/types';
import { parseJSON } from '../../lib/utils';

interface IParserResult {
	error?: InteractionReplyOptions;
	result?: ICodeExecutionOptions;
}

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ModalSubmitHandler extends InteractionHandler {
	public override async run(interaction: ModalSubmitInteraction, result: IParserResult) {
		if (result.error) {
			return interaction.reply(result.error);
		}

		await interaction.deferReply();

		const data = await executeCode(result.result!);
		const errMsg = (data as ICodeExecutionErrorResult).message;
		if (errMsg) {
			return interaction.followUp({
				embeds: [
					{
						color: 'RED',
						description: errMsg,
						title: 'Something Went Wrong!'
					}
				]
			});
		}

		const evalResult = data as ICodeExecutionResult;
		const output = (evalResult.run.output || evalResult.run.stdout || evalResult.run.stderr || '').substring(0, 2048);

		const embed = new MessageEmbed()
			.setAuthor({
				name: 'Code Evaluation Result'
			})
			.setTitle(`${evalResult.language} v${evalResult.version || 'Latest'}`)
			.setDescription(Formatters.codeBlock(evalResult.language, output || '<No Output>'))
			.setColor('BLURPLE')
			.setFooter({
				text: `Code: ${evalResult.run.code || 0} | Signal: ${evalResult.run.signal || 'N/A'}`
			});

		return interaction.followUp({
			content: `The code was executed with ${Formatters.hideLinkEmbed('https://github.com/engineer-man/piston')}`,
			embeds: [embed]
		});
	}

	public override async parse(interaction: ModalSubmitInteraction) {
		if (!interaction.customId.startsWith('code_runner-')) {
			return this.none();
		}

		const runtimeInfoRaw = interaction.customId.replace('code_runner-', '');
		const runtime = parseJSON<{
			language: string;
			runtime?: string;
			version: string;
		}>(runtimeInfoRaw);

		if (!runtime) return this.none();

		const allItems = await getRuntimes();

		const runtimeInfo = allItems.find((res) => {
			const rt = runtime.runtime?.toLowerCase();
			const lang = runtime.language.toLowerCase();

			if (rt) {
				return (
					(res.runtime?.toLowerCase() === rt || res.alias?.includes(rt)) &&
					res.language.toLowerCase() === lang &&
					res.version === runtime.version
				);
			} else {
				return (res.language.toLowerCase() === lang || res.alias?.includes(lang)) && res.version === runtime.version;
			}
		});

		if (!runtimeInfo)
			return this.some({
				error: {
					embeds: [
						{
							description: `Language you provided is unknown to me 🙁`,
							title: 'Something Went Wrong!',
							color: 'DARK_RED'
						}
					],
					ephemeral: true
				}
			} as IParserResult);

		return this.some({
			result: {
				code: interaction.fields.getTextInputValue('source_code'),
				language: runtimeInfo.language,
				args: interaction.fields.getTextInputValue('args')?.split(',') || [],
				fileName: interaction.fields.getTextInputValue('source_file') || undefined,
				stdin: interaction.fields.getTextInputValue('stdin') || '',
				version: runtimeInfo.version
			}
		} as IParserResult);
	}
}
