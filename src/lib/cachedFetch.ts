import Fuse from 'fuse.js';
import NodeCache from 'node-cache';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { setTimeout } from 'timers/promises';
import { default as NodeFetch } from 'node-fetch';

//
import { hackSquadApiUrl, novuApiUrl, pistonExecuteUrl, pistonRuntimesUrl } from './constants';
import type {
	ICodeExecutionErrorResult,
	ICodeExecutionOptions,
	ICodeExecutionPayload,
	ICodeExecutionResult,
	ILeaderboardResponse,
	ILeaderboardTeam,
	INovuContributorsResponse,
	IPistonRuntime,
	NovuContributor
} from './types';

//
const cache = new NodeCache({ stdTTL: 15 * 60 });

//
const teamKey = 'hacksquad-team';
const contributorKey = 'novu-contributors';
const runtimesKey = 'piston-runtimes';
const lastPistonExecution = 'last-pistion-exec';

//
export const hackSquadTeamFuse = new Fuse<ILeaderboardTeam>([], {
	keys: ['name'],
	threshold: 0.3
});

export const novuContributorsFuse = new Fuse<NovuContributor>([], {
	keys: ['github', 'name'],
	threshold: 0.3
});

export const pistonRuntimesFuse = new Fuse<IPistonRuntime>([], {
	keys: ['language', 'alias', 'runtime'],
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

export const getRuntimes = async () => {
	const cachedRuntimes = cache.get<IPistonRuntime[]>(runtimesKey);
	if (cachedRuntimes) return cachedRuntimes;

	const runtimes = await fetch<IPistonRuntime[]>(pistonRuntimesUrl, FetchResultTypes.JSON);
	if (!Array.isArray(runtimes)) return [];

	cache.set(runtimesKey, runtimes, 5 * 60 * 60);

	pistonRuntimesFuse.setCollection(runtimes);

	return runtimes;
};

export const executeCode = async (options: ICodeExecutionOptions): Promise<ICodeExecutionResult | ICodeExecutionErrorResult> => {
	const payload = {
		args: Array.isArray(options.args) ? options.args : [],
		files: [
			{
				content: options.code,
				name: options.fileName || undefined
			}
		],
		language: options.language,
		version: options.version,
		stdin: options.stdin || ''
	} as ICodeExecutionPayload;

	const execQuota = cache.get<number>(lastPistonExecution);
	const quotaExceeded = typeof execQuota === 'number' && execQuota >= 4;
	if (quotaExceeded) await setTimeout(2000);

	cache.set(lastPistonExecution, quotaExceeded ? 1 : (execQuota || 0) + 1, 5);

	try {
		const response = await NodeFetch(pistonExecuteUrl, {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const m = await response.json();
		if (response.status !== 200) throw new Error(m.message || `Request to ${pistonExecuteUrl} failed with status code ${response.status}`);

		return m as ICodeExecutionResult;
	} catch (e) {
		return { message: `${e}` };
	}
};
