import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';

//
import type { AutocompleteInteraction } from 'discord.js';

//
import { getTeamList, hackSquadTeamFuse } from '../../lib/cachedFetch';

//
@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class AutocompleteHandler extends InteractionHandler {
	public override async run(interaction: AutocompleteInteraction, result: any) {
		return interaction.respond(result);
	}

	public override async parse(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'team') {
			return this.none();
		}

		// Fetching all the teams
		const allItems = await getTeamList();

		//
		const focusedOption = interaction.options.getFocused(true);
		const currentValue = focusedOption.value;

		const searchValue = currentValue.toLowerCase().trim();

		// Serching with Fuse.js
		const searchResult = searchValue
			? // Searching with Fuse.js
			  hackSquadTeamFuse.search(searchValue).map((itm) => itm.item)
			: // Return all items by default
			  allItems;

		const teamItems = searchResult //
			.slice(0, 25)
			.map((team) => ({ name: team.name, value: team.slug }));

		//
		return this.some(teamItems);
	}
}
