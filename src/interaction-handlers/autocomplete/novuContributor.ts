import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';

//
import type { AutocompleteInteraction } from 'discord.js';

//
import { getContributorsList, novuContributorsFuse } from '../../lib/cachedFetch';

//
@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class AutocompleteHandler extends InteractionHandler {
	public override async run(interaction: AutocompleteInteraction, result: any) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'contributor') {
			return this.none();
		}

		//
		const allItems = await getContributorsList();

		//
		const focusedOption = interaction.options.getFocused(true);
		const currentValue = focusedOption.value;

		const searchValue = currentValue.toLowerCase().trim();

		// Filtering the items
		const searchResult = searchValue
			? // Do fussy search if there is any input
			  novuContributorsFuse.search(searchValue).map((itm) => itm.item)
			: // Return all items by default
			  allItems;

		const contributorList = searchResult //
			.slice(0, 25)
			.map((contributor) => ({
				name: contributor.name ? `${contributor.name} (${contributor.github})` : contributor.github,
				value: contributor.github
			}));

		//
		return this.some(contributorList);
	}
}
