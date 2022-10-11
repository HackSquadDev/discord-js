import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'ping pong'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	// slash command
	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		const msg = await interaction.deferReply({ fetchReply: true });
		const createdTime = msg instanceof Message ? msg.createdTimestamp : Date.parse(msg.timestamp);

		return await interaction.followUp({
			embeds: [
				{
					title: 'Pong!',
					color: 'BLURPLE',
					fields: [
						{
							name: 'Gateway Latency',
							value: `${Math.round(this.container.client.ws.ping)}ms`
						},
						{
							name: 'API Latency',
							value: `${Date.now() - createdTime}ms`
						}
					],
					timestamp: Date.now()
				}
			]
		});
	}
}
