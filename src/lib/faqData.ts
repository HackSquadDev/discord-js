import { Formatters } from 'discord.js';
import Fuse from 'fuse.js';

const faqList: IFaqData[] = [
	// FAQs from the website
	{
		question: "What's in it for me?",
		answer: 'Meet amazing new people, get more involved with the open-source community and win awesome swag!'
	},
	{
		question: 'When is the event happening?',
		answer: 'Between 1st - 31st October 2022'
	},
	{
		question: 'How does it work?',
		answer: 'Register to the HackSquad using your GitHub, Join a squad or get assigned to a random squad, contribute code and get Swag!'
	},
	{
		question: 'How many members can join a squad?',
		answer: 'Each squad can have a maximum of 5 members. If you can\'t find all 5, you can always turn on the "Allow random people to join my squad"'
	},
	{
		question: 'How do we calculate the score?',
		answer: 'Each hour we calculate the number of MERGED PRs of each squad member and sum them all up. Each PR is worth 1 point. By the end of the event, the top 60 squads will win awesome swag! **We even have bonuses**'
	},
	{
		question: 'How many people will get swag?',
		answer: 'The top 60 squads will win awesome swag! around ~300 winners!'
	},
	{
		question: 'Can I register for both Hacktoberfest and Hacksquad?',
		answer: 'Yes, and even recommended! Each contribution will be counted for both Hacktoberfest and HackSquad'
	},
	{
		question: 'Do I need other people to help me contribute code?',
		answer: 'You can join a squad and invite friends or we will auto-assign you to another squads'
	},
	{
		question: 'Which repository can I contribute to?',
		answer: 'Any public repository you want! Please make sure not to spam! We check 🤫'
	},
	{
		question: 'My team won! am I going to get SWAG?',
		answer: 'To win swag, even if your team wins, you would need to have 1 MERGED PR'
	},
	{
		question: 'I want support / get more updates / find a squads member',
		answer: `Feel free to follow us on ${Formatters.hyperlink('Twitter', 'https://twitter.com/HackSquadDev')} and join our ${Formatters.hyperlink(
			'Discord',
			'https://discord.gg/vcqkXgT3Xr'
		)}`
	},
	{
		question: 'Is the swag in the picture the actual swag?',
		answer: "Most of it is! We will also add more Swag from our sponsors. We still haven't finalized everything."
	},
	{
		question: 'How long will it take to receive the swag?',
		answer: 'We are sending the swag from the US. We assume that it will reach everybody within 60-90 days.'
	},
	{
		question: 'Do I need to pay duty for the SWAG?',
		answer: 'No! We are taking care of it!'
	},
	{
		question: 'I want to create a workshop for the event during October',
		answer: "That's awesome! We would be super happy to give you a stage, please email us at nevo@novu.co"
	},
	/**
	 * Other FAQs
	 * Will be really handy if the bot is used in the server afterwards!
	 */
	{
		question: 'Why are my PRs getting deleted?',
		answer: [
			'There can be few reasons for your PRs getting deleted:',
			'',
			'`-` The PR is made on a DSA repository',
			'`-` The PR is made just to +1 your PR count during the event',
			'`-` The PR is on your own repo (We know valuable contributions can be done to your own repo, but in order to do this you need strong reasons)'
		].join('\n')
	},
	{
		question: 'Will there be different (or more) swags for coming on top X position?',
		answer: 'Nope the swags are same for everyone'
	},
	{
		question: 'Can I know who deleted my PR, disqualified me/my team and why?',
		answer: `You can check the logs ${Formatters.hyperlink(
			'here',
			'https://flask-production-924c.up.railway.app/'
		)} and ask the moderator about the reason 🙏`
	}
];

//
const faqFuse = new Fuse<IFaqData>(faqList, {
	keys: ['question'],
	threshold: 0.3
});

//
interface IFaqData {
	question: string;
	answer: string;
}

//
export { faqList, faqFuse };
