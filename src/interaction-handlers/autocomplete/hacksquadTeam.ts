import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';

//
import type { AutocompleteInteraction } from 'discord.js';

//
import { getTeamList } from '../../lib/cachedFetch';

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
		const teams = await getTeamList();

		//
		const focusedOption = interaction.options.getFocused(true);
		const currentValue = focusedOption.value;

		const searchValue = currentValue.toLowerCase().trim();

		//
		const teamItems = teams
			// Filtering by team name
			.filter((team) => team.name.toLowerCase().includes(searchValue))
			// Formatting as necessary
			.map((team) => ({ name: team.name, value: team.slug }))
			.slice(0, 25);

		//
		return this.some(teamItems);
	}
}
