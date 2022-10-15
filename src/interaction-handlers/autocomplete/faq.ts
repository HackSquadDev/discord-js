import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';

//
import type { AutocompleteInteraction } from 'discord.js';

//
import { faqFuse, faqList } from '../../lib/faqData';

//
@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class AutocompleteHandler extends InteractionHandler {
	public override async run(interaction: AutocompleteInteraction, result: any) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'faq') {
			return this.none();
		}

		//
		const focusedOption = interaction.options.getFocused(true);
		const currentValue = focusedOption.value;

		const searchValue = currentValue.toLowerCase().trim();

		// Serching with Fuse.js
		const searchResult = searchValue
			? // Searching with Fuse.js
			  faqFuse.search(searchValue).map((itm) => itm.item)
			: // Return all items by default
			  faqList;

		const faqItems = searchResult //
			.slice(0, 25)
			.map((faq) => ({ name: faq.question, value: faq.question.toLowerCase() }));

		//
		return this.some(faqItems);
	}
}
