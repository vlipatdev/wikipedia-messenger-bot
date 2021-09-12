// port
const port = process.env.PORT || 3000;

// config
const config = require('./config');

// bad words list
const badWords = require('./bad-words');

// axios
const axios = require('axios');

// bootbot
const BootBot = require('bootbot');
const { response } = require('express');
const bot = new BootBot({
	accessToken: config.accessToken,
	verifyToken: config.verifyToken,
	appSecret: config.appSecret,
});

/* -------------------------------------------------------------------------- */
/*                                   REPLIES                                  */
/* -------------------------------------------------------------------------- */

// hi/hello
bot.hear(/^(hi|hello).*$/i, (_, chat, data) => {
	if (data.captured) return;

	chat.sendAction('mark_seen').then(() => {
		chat.getUserProfile().then((user) => {
			chat.say(`Hello, ${user.first_name}!`, { typing: true });
		});
	});
});

// hey
bot.hear([/^(hey).*$/i], (_, chat, data) => {
	if (data.captured) return;

	chat.sendAction('mark_seen').then(() => {
		chat.say(`Hey!`, { typing: true });
	});
});

// thanks
bot.hear([/^(thank|tnx|salamat).*$/i], (_, chat, data) => {
	if (data.captured) return;

	const replies = [
		'Anything for you! 🙂',
		'Happy I could be of help. 🙂',
		'I’m happy to be of service. 🙂',
		'It’s my pleasure. 🙂',
		'Anytime! 🙂',
		'You are very welcome! 🙂',
		'My pleasure. 🙂',
		'Glad to help. 🙂',
		'Sure. 🙂',
		'👌',
	];

	const randIdx = Math.floor(Math.random() * replies.length);

	chat.sendAction('mark_seen').then(() => {
		chat.say(replies[randIdx], { typing: true });
	});
});

/* -------------------------------------------------------------------------- */
/*                               PERSISTENT MENU                              */
/* -------------------------------------------------------------------------- */

bot.setPersistentMenu([
	{
		type: 'postback',
		title: '🙋 Help',
		payload: 'PERSISTENT_MENU_HELP',
	},
	{
		type: 'postback',
		title: '📝 Policies',
		payload: 'PERSISTENT_MENU_POLICIES',
	},
]);

/* -------------------------------------------------------------------------- */
/*                                  GREETING                                  */
/* -------------------------------------------------------------------------- */

bot.setGreetingText('Hello! I can help you search Wikipedia using free data.');

bot.setGetStartedButton((_, chat) => {
	chat.sendAction('mark_seen');

	chat.getUserProfile().then((user) => {
		chat.say(
			[
				`👋 Hi, ${user.first_name}! My name is Atom. I can help you search Wikipedia using free data.`,
				'To start searching, please follow this format:\n<wiki>SPACE<search query>\n\nExample:\nwiki astronomy \n\nYou can try it by typing it below 👇',
				`If you need help, you can always press the '🙋 Help' button below.`,
				`Please note that some of my features may not work on Messenger Lite.`,
			],
			{ typing: true }
		);
	});
});

/* -------------------------------------------------------------------------- */
/*                                   EXAMPLE                                  */
/* -------------------------------------------------------------------------- */

// bot.on('postback:EXAMPLE', (_, chat, data) => {
// 	if (data.captured) return;
// 	chat.sendAction('mark_seen');

// 	let BASE_URL =
// 		'https://en.wikipedia.org/w/api.php?action=opensearch&limit=12&namespace=0&format=json&search=';

// 	let query = 'diwata-1';
// 	const quickReplies = [];

// 	if (query) {
// 		axios.get(`${BASE_URL}${encodeURI(query)}`).then((response) => {
// 			response.data[1].map((el) => {
// 				quickReplies.push({
// 					title: el,
// 					payload: el,
// 				});
// 			});

// 			chat.say(
// 				{
// 					text: 'Please select one 👇',
// 					quickReplies,
// 				},
// 				{ typing: true }
// 			);
// 		});
// 	}
// });

/* -------------------------------------------------------------------------- */
/*                                  POLICIES                                  */
/* -------------------------------------------------------------------------- */

bot.on('postback:PERSISTENT_MENU_POLICIES', (_, chat) => {
	chat.sendAction('mark_seen');

	chat.say(
		[
			' This Messenger chatbot was developed for students with poor Internet connection and students with no data.\n\nIn order to accommodate as many users as possible, here are some ground rules:\n\n👉 Avoid making too many searches. Please search only for what you need. If we detect spam on your end, you may be blocked from using this service.\n\n👉 Bad words, profanities, and other inappropriate search terms are not allowed.',
		],
		{ typing: true }
	);
});

/* -------------------------------------------------------------------------- */
/*                                    HELP                                    */
/* -------------------------------------------------------------------------- */

bot.on('postback:PERSISTENT_MENU_HELP', (_, chat) => {
	chat.sendAction('mark_seen');

	chat.say(['Need help?'], {
		typing: true,
	});
});

/* -------------------------------------------------------------------------- */
/*                                   SEARCH                                   */
/* -------------------------------------------------------------------------- */

bot.hear(/^(wiki ).*$/i, (payload, chat) => {
	chat.sendAction('mark_seen');

	let BASE_URL =
		'https://en.wikipedia.org/w/api.php?action=opensearch&limit=13&namespace=0&format=json&search=';

	let query = payload.message.text.slice(5);
	const quickReplies = [];

	if (badWords.includes(query)) {
		chat.say(`Sorry, this search query not allowed. `, { typing: true });
	} else {
		if (query) {
			axios.get(`${BASE_URL}${encodeURI(query)}`).then((response) => {
				if (response.data[1].length === 0) {
					chat.say(`I found no Wikipedia articles for '${query}'. Please try different keywords.`, {
						typing: true,
					});
				} else {
					response.data[1].map((el) => {
						quickReplies.push({
							title: el,
							payload: el,
						});
					});

					chat.say(
						{
							text: 'Please select one 👇',
							quickReplies,
						},
						{ typing: true }
					);
				}
			});
		} else {
			chat.say('Sorry, search query cannot be empty.', { typing: true });
		}
	}
});

/* -------------------------------------------------------------------------- */
/*                                 QUICK REPLY                                */
/* -------------------------------------------------------------------------- */

bot.on('quick_reply', (payload, chat) => {
	let BASE_URL =
		'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exlimit=max&explaintext&exintro&redirects=1&titles=';

	const query = payload.message.quick_reply.payload;
	if (query) {
		axios
			.get(`${BASE_URL}${encodeURI(query)}`)
			.then((response) => {
				chat.sendAction('mark_seen');

				const obj = response.data.query.pages;
				const title = obj[Object.keys(obj)[0]].title;
				const extract = obj[Object.keys(obj)[0]].extract;

				chat.say([`Showing result for '${title}'`, `${title} - Wikipedia`]).then(() => {
					const chunks = [];
					for (let chars = 0; chars < extract.length; chars += 2000) {
						chunks.push(extract.slice(chars, chars + 2000));
					}

					chat.say(chunks).then(() => {
						chat
							.say(`Source: https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}`)
							.then(() => {
								if (
									extract.includes('may refer to') ||
									extract.includes('most commonly refers to')
								) {
									chat.say([`Try adding more keywords to your search to get a better result.`], {
										typing: true,
									});
								}
							});
					});
				});
				// }
			})
			.catch((e) => {
				console.log(e);
			});
	}
});

/* -------------------------------------------------------------------------- */
/*                                   SERVER                                   */
/* -------------------------------------------------------------------------- */

bot.start(port, () => {
	console.log('Server has started...');
});

/* -------------------------------------------------------------------------- */
/*                                   EXTRAS                                   */
/* -------------------------------------------------------------------------- */

// wiki search tagalog
// if (query.includes('tagalog')) {
// 	BASE_URL =
// 		'https://tl.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exlimit=max&explaintext&exintro&redirects=1&titles=';
// 	LANGUAGE = 'tl';
// 	const idx = query.length - 7;
// 	query = payload.message.text.slice(5, 5 + idx);
// }
