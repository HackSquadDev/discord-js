import { MessageActionRow, MessageButton, type Message, type InteractionReplyOptions, type ButtonInteraction } from 'discord.js';
import type { Command } from '@sapphire/framework';
import type { InteractionButtonOptions } from 'discord.js';

interface IPaginateProps {
	msg: Message<true>;
	buttons: ReturnType<typeof createPaginationButtons>;
	interaction: Command.ChatInputInteraction;
	pages: unknown[];
	currentPage: number;
}

type PaginatorDispatchCallback = (interaction: ButtonInteraction<'cached'>, pageNumber: number) => Awaited<void>;

export function createPaginationButtons() {
	const row = new MessageActionRow();
	const buttons = [
		{
			customId: 'first',
			emoji: '⏪',
			style: 'PRIMARY'
		},
		{
			customId: 'previous',
			emoji: '◀️',
			style: 'PRIMARY'
		},
		{
			customId: 'close',
			emoji: '🗑️',
			style: 'SECONDARY'
		},
		{
			customId: 'next',
			emoji: '▶️',
			style: 'PRIMARY'
		},
		{
			customId: 'last',
			emoji: '⏩',
			style: 'PRIMARY'
		}
	] as Array<InteractionButtonOptions>;

	return row.addComponents(buttons.map((m) => new MessageButton(m)));
}

export function paginate({ msg, buttons, interaction, pages, currentPage }: IPaginateProps, dispatch: PaginatorDispatchCallback) {
	const collector = msg.createMessageComponentCollector({
		componentType: 'BUTTON',
		time: 60_000,
		filter: (m) => m.message.id === msg.id && buttons.components.some((r) => r.customId === m.customId)
	});

	collector.on('collect', async (intr) => {
		if (interaction.replied) return;
		if (interaction.user.id !== intr.user.id) {
			const err = {
				embeds: [
					{
						title: '❌ Permission Error',
						description: `Only ${interaction.user.toString()} is allowed to use this button.`,
						color: 'RED'
					}
				],
				ephemeral: true
			} as InteractionReplyOptions;
			if (interaction.deferred) return void (await interaction.followUp(err));
			return void (await interaction.reply(err));
		}

		switch (intr.customId) {
			case 'first':
			case 'last':
				collector.resetTimer();
				await intr.deferUpdate();
				currentPage = intr.customId === 'first' ? 0 : pages.length - 1;
				await dispatch(intr, currentPage);
				break;

			case 'previous':
				collector.resetTimer();
				await intr.deferUpdate();
				currentPage = currentPage - 1 < 0 ? pages.length - 1 : currentPage - 1;
				await dispatch(intr, currentPage);
				break;

			case 'next':
				collector.resetTimer();
				await intr.deferUpdate();
				currentPage = currentPage + 1 >= pages.length ? 0 : currentPage + 1;
				await dispatch(intr, currentPage);
				break;

			case 'close':
				if (intr.message.deletable) await intr.message.delete().catch(() => null);
				collector.stop();
				break;
		}

		return;
	});

	collector.once('end', async () => {
		if (msg.editable) {
			msg.components.forEach((m) => m.components.map((n) => n.setDisabled(true)));
			await msg.edit({ components: msg.components }).catch(() => null);
		}
	});
}
