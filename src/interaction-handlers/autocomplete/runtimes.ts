import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';

//
import type { AutocompleteInteraction } from 'discord.js';

//
import { getRuntimes, pistonRuntimesFuse } from '../../lib/cachedFetch';
import { paren } from '../../lib/utils';

//
@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class AutocompleteHandler extends InteractionHandler {
	public override async run(interaction: AutocompleteInteraction, result: any) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'run') {
			return this.none();
		}

		// Fetching all the available runtimes
		const allItems = await getRuntimes();

		//
		const focusedOption = interaction.options.getFocused(true);
		const currentValue = focusedOption.value;

		const searchValue = currentValue.toLowerCase().trim();

		// Serching with Fuse.js
		const searchResult = searchValue
			? // Searching with Fuse.js
			  pistonRuntimesFuse.search(searchValue).map((itm) => itm.item)
			: // Return all items by default
			  allItems;

		const runtimesResult = searchResult //
			.slice(0, 25)
			.map((rt) => ({
				name: `${rt.language} ${rt.runtime ? paren(rt.runtime) : ''}`.trim(),
				value: JSON.stringify({
					runtime: rt.runtime || null,
					language: rt.language,
					version: rt.version
				})
			}));

		//
		return this.some(runtimesResult);
	}
}
