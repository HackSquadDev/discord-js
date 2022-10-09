// https://www.hacksquad.dev/api/leaderboard
export interface ILeaderboardResponse {
	teams: {
		id: string;
		name: string;
		score: number;
		slug: string;
	}[];
}

// https://www.hacksquad.dev/api/team?id={slug}
export interface ITeamResponse {
	team: {
		id: string;
		name: string;
		slug: string;
		score: number;
		ownerId: string;
		prs: string; // Parse JSON
		githubTeamId?: string;
		allowAutoAssign: boolean;
		disqualified: boolean;
		users: ITeamUser[];
	};
}

interface ITeamUser {
	createdAt: string;
	id: string;
	name: string;
	emailVerified?: boolean;
	image: string;
	moderator: string;
	handle: string;
	teamId: string;
	inviteId?: string;
	disqualified: boolean;
	githubUserId?: string;
}

export interface IPullRequestInfo {
	id: string;
	createdAt: string;
	title: string;
	url: string;
	status?: 'DELETED';
}

// https://contributors.novu.co/contributors-mini
export interface INovuContributorsResponse {
	list: {
		_id: string;
		github: string;
		avatar_url: string;
		name?: string;
		totalPulls: number;
	}[];
}

// https://contributors.novu.co/contributor/{name}
export interface INovuContributorResponse {
	_id: string;
	github: string;
	avatar_url: string;
	bio?: string;
	first_activity_occurred_at: string;
	github_followers?: number;
	id: string;
	languages: string[];
	last_activity_occurred_at?: string;
	location: string;
	company?: string;
	name: string;
	pulls: {
		url: string;
		number: number;
		title: string;
		created_at: string;
	}[];
	slug: string;
	twitter: string;
	twitter_followers?: number;
	url?: string;
	totalPulls: number;
}

// https://contributors.novu.co/badge/{name}
export interface INovuBadgeResponse {
	name: string;
	avatar_url: string;
	totalPulls: number;
	pulls: {
		total: string;
		date: string;
	}[];
}
