import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';

//
import type { AutocompleteInteraction } from 'discord.js';

//
import { getContributorsList } from '../../lib/cachedFetch';

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
		const contributors = await getContributorsList();

		//
		const focusedOption = interaction.options.getFocused(true);
		const currentValue = focusedOption.value;

		const searchValue = currentValue.toLowerCase().trim();

		// Filtering the contributor list
		const contributorList = contributors
			// Removing bots from contributor list
			.filter((contributor) => !contributor.github.includes('bot'))
			// Removing users with no contributions
			.filter((contributor) => contributor?.totalPulls > 0)
			// Filter by name or github ID
			.filter((contributor) => contributor.name?.toLowerCase().includes(searchValue) || contributor.github.toLowerCase().includes(searchValue))
			// Formatting as necessary
			.map((contributor) => ({
				name: contributor.name ? `${contributor.name} (${contributor.github})` : contributor.github,
				value: contributor.github
			}))
			.slice(0, 25);

		//
		return this.some(contributorList);
	}
}
