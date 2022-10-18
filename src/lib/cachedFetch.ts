import Fuse from 'fuse.js';
import NodeCache from 'node-cache';
import { fetch, FetchResultTypes } from '@sapphire/fetch';

//
import { hackSquadApiUrl, novuApiUrl } from './constants';
import type { ILeaderboardResponse, ILeaderboardTeam, INovuContributorsResponse, NovuContributor } from './types';

//
const cache = new NodeCache({ stdTTL: 15 * 60 });

//
const teamKey = 'hacksquad-team';
const contributorKey = 'novu-contributors';

//
export const hackSquadTeamFuse = new Fuse<ILeaderboardTeam>([], {
	keys: ['name'],
	threshold: 0.3
});

export const novuContributorsFuse = new Fuse<NovuContributor>([], {
	keys: ['github', 'name'],
	threshold: 0.3
});

//
export const getTeamList = async () => {
	// Findign and erturning from cache
	const existingItems = cache.get<ILeaderboardTeam[]>(teamKey);
	if (existingItems) return existingItems;

	// Fetching if not exists
	const { teams } = await fetch<ILeaderboardResponse>(`${hackSquadApiUrl}/leaderboard`, FetchResultTypes.JSON);

	// Setting the items to cache
	cache.set(teamKey, teams);

	// Setting fuse collection
	hackSquadTeamFuse.setCollection(teams);

	//
	return teams;
};

//
export const getContributorsList = async () => {
	// Findign and erturning from cache
	const existingItems = cache.get<NovuContributor[]>(contributorKey);
	if (existingItems) return existingItems;

	// Fetching if not exists
	const { list } = await fetch<INovuContributorsResponse>(`${novuApiUrl}/contributors-mini`, FetchResultTypes.JSON);

	// Setting the items to cache
	cache.set(contributorKey, list);

	// Setting fuse collection
	novuContributorsFuse.setCollection(list);

	//
	return list;
};
