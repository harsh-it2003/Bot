const Discord = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { GatewayIntentBits } = require('discord.js');
const translate = require('translate-google');
const axios = require('axios');
const API_KEY = '84TRJE-YLWT688QHA';
const userHandles = {};
const moment = require('moment');
const Chart = require('chart.js/auto');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const QuickChart = require('quickchart-js');
const { isInteger, delay, fetchLastSubmission, plotGraph, fetchFutureContests, fetchProblemSet, fetchRandomUnsolvedProblem } = require('./helperFunctions.js');
require('dotenv').config();


const cussWords = ['cussword1', 'cussword2'];


const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});


// intents are used to specify what events your bot should have access to and receive from Discord servers.
// By specifying intents, you have finer control over the events your bot can interact with, optimizing performance and respecting privacy boundaries.


function isModerator(a, b) {
    return (a === 'harshit147' && b === '6563');
}


client.on('ready', () => {
    console.log('this bot is ready');
})


client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;

    // for kicking the user who used cuss words
    {
        const content = message.content.toLowerCase();
        const containsCuss = cussWords.some((word) => content.includes(word));

        if (containsCuss) {
            const offender = message.member;
            offender.kick('Used offensive language')
                .then(() => {
                    message.channel.send(`kicked ${message.author.username + message.author.discriminator} for using offensive language`);
                    message.delete()
                        .then(() => {
                            console.log('Cuss word message deleted');
                        })
                        .catch((error) => {
                            console.error('Error deleting cuss word message:', error);
                        });
                })
                .catch((error) => {
                    console.error('Error kicking user:', error);
                });
        }
    }


    // commands
    if (message.content.startsWith('!time')) {
        const currentTime = new Date().toLocaleTimeString();
        message.channel.send(`The current time is: ${currentTime}`);
    }

    if (message.content.startsWith('!translate')) {
        const args = message.content.split(' ');
        if (args.length < 3) {
            message.reply('Please provide the language you wanna translate to and also the message');
            return;
        }
        const targetLang = args[1];
        const textToTrans = args.slice(2).join(' ');

        translate(textToTrans, { to: targetLang })
            .then((res) => {
                const translation = res;
                message.channel.send(`${translation}`);
            })
            .catch((err) => {
                // console.error('Translation error:', err);
                message.reply('Use the right code or conventions');
            });
    }


    if (message.content.startsWith('!createpoll')) {
        const content = message.content.slice(12);
        const [question, ...options] = content.split(', ');

        if (!question || options.length < 2) {
            message.reply('Please provide a question and at least two options for the poll.');
            return;
        }
        let pollMessage = `**${question}**\n\n`;
        const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        options.map((option, index) => {
            pollMessage += `${index + 1}. ${option.trim()}\n`;
        });

        message.channel.send(pollMessage)
            .then((sentMessage) => {
                for (let i = 0; i < options.length; i++) {
                    sentMessage.react(emojiNumbers[i]);
                }
            })
            .catch((error) => {
                console.error('Error sending poll:', error);
            });

    }


    if (message.content.startsWith('!avatar')) {
        const user = (message.mentions.users.length ? message.mentions.users.first() : message.author);
        return message.reply(user.displayAvatarURL({ dynamic: true, size: 4096 }));
    }

    // command to ban a user 
    if (message.content.startsWith('!ban')) {

        if (!isModerator(message.author.username, message.author.discriminator)) {
            return message.reply('You do not have permission to ban members.');
        }

        const userToBan = message.mentions.users.first();
        if (!userToBan) {
            return message.reply('Please mention a user to ban.');
        }
        // resolve function is fetching the corresponding guildmember of userToBan
        const memberToBan = message.guild.members.resolve(userToBan);

        memberToBan.ban()
            .then(() => {
                message.reply(`Successfully banned ${userToBan.tag}.`);
            })
            .catch((error) => {
                console.error('Error banning user:', error);
                message.reply('An error occurred while banning the user.');
            });
    }

    // unban a member
    if (message.content.startsWith('!unban')) {
        if (!isModerator(message.author.username, message.author.discriminator)) {
            return message.reply('You do not have permission to unban members.');
        }
        const userToUnban = message.content.split(' ').slice(1)[0];
        if (!userToUnban) {
            return message.reply('Please give the username also');
        }

        const guild = message.guild;
        guild.bans.fetch().then((bans) => {
            const unbanMember = bans.find((ban) => ban.user.username + ban.user.discriminator === userToUnban);
            if (unbanMember) {
                guild.members.unban(unbanMember.user)
                    .then(() => message.reply("succesfully unbanned"))
                    .catch((err) => message.reply("please try again later"));
            } else {
                message.reply('mentioned user is not banned.')
            }
        });

    }

    // search online
    if (message.content.startsWith('!search')) {
        const query = message.content.slice(8).trim();
        const apiUrl = `http://api.wolframalpha.com/v1/result?appid=${API_KEY}&i=${encodeURIComponent(query)}`;

        try {
            const response = await axios.get(apiUrl);
            const answer = response.data.toString();
            message.channel.send(answer);
        } catch (error) {
            // console.error('Error fetching answer from Wolfram Alpha API:', error);
            message.channel.send("Oops! wolfram doesn't know about it.");
        }
    }

    if (message.content.startsWith('!bulkDelete')) {
        if (!isModerator(message.author.username, message.author.discriminator)) {
            return message.reply("You don't have permissions");
        }

        const channelName = message.content.slice(12);
        const channel = message.guild.channels.cache.find((ch) => ch.name === channelName);
        channel.messages.fetch()
            .then(messages => {
                channel.bulkDelete(messages)
                    .then(console.log('Deleted all the messages of this channel successfully'))
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    }

    // for handling codeforces commands
    if (message.content.startsWith('!cf')) {
        // Get the Codeforces handle provided in the command
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // If the user wants to set their handle
        if (args.length === 0) {
            return message.reply('inadequate info about the query');
        }
        else if (args[0] === 'set') {
            const handle = args[1];
            if (handle) {
                // Store the user's handle in the userHandles object
                const problems = await fetchProblemSet(800);
                const problem = problems[0];

                const problemLink = `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;

                const embed = new EmbedBuilder()
                    .setTitle(problem.index + ' ' + problem.name)
                    .addFields({ name: 'Rating', value: (problem.rating).toString() })
                    .setColor('#00ff00')
                    .setURL(problemLink);

                message.channel.send(({ embeds: [embed] }));
                message.reply('submit the above prroblem with compilation error, within 40 seconds');

                await delay(40000);

                const lastSubmission = await fetchLastSubmission(handle);
                if (lastSubmission && lastSubmission.problem.name === problem.name && lastSubmission.problem.rating === problem.rating) {
                    userHandles[message.author.id] = handle;
                    return message.reply(`Your Codeforces handle has been set to: ${handle}`);
                }
                else {
                    return message.reply("Didn't set the handle coz of inactivity");
                }

            } else {
                message.reply('Please provide a Codeforces handle after the command.');
            }
        }
        else if (args[0] === 'get') {
            const userMention = message.mentions.users.first();
            if (!userMention) {
                message.reply('Please mention a user after the command.');
                return;
            }

            // Fetch the user's handle and rating from Codeforces API
            try {
                const handle = userHandles[userMention.id];
                if (!handle) {
                    return message.reply('User handle is not set yet');
                }
                const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
                const userData = response.data.result[0];

                const embed = new EmbedBuilder()
                    .setTitle(`Codeforces User Profile for ${userData.handle}`)
                    .addFields({ name: 'Rating', value: (userData.rating || 'Unrated').toString() })
                    .setThumbnail(userData.titlePhoto)
                    .setURL(`https://codeforces.com/profile/${userData.handle}`)
                    .setColor('#00ff00');

                message.channel.send({ embeds: [embed] });

            } catch (error) {
                // console.error('Error fetching Codeforces user data:', error);
                message.reply('An error occurred while fetching the data. Please try again later.');
            }

        }
        else if (args[0] === 'plot') {
            const mentionedUser = (message?.mentions?.length === 0 ? message.author.id : message.mentions.users.first());

            if (!mentionedUser) {
                return message.reply('Mention users');
            }

            // Get the Codeforces handle from the map using the mentioned user's ID
            const handle = userHandles[mentionedUser.id];
            if (!handle) {
                message.reply('The mentioned user does not have a Codeforces handle set.');
                return;
            }

            // // Fetch the user's data from Codeforces API
            try {
                const response = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
                const ratingData = response.data.result;


                if (!ratingData || ratingData.length === 0) {
                    message.reply('No rating data found for the specified user.');
                    return;
                }

                // Sort rating data by time in ascending order
                ratingData.sort((a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds);

                // Prepare data for rating graph
                const graphData = ratingData.map((entry) => {
                    return {
                        x: new Date(entry.ratingUpdateTimeSeconds * 1000),
                        y: entry.newRating,
                    };
                });

                // Create the embed with the rating graph
                const embed = new EmbedBuilder()
                    .setTitle(`Codeforces Rating Graph for ${handle}`)
                    .setColor('#00ff00')
                    .setImage(await plotGraph(graphData, handle));

                return message.channel.send({ embeds: [embed] });

            } catch (error) {
                // console.error('Error fetching Codeforces user data:', error);
                return message.reply('An error occurred while fetching the data. Please try again later.');
            }
        }
        else if (args[0] == 'contestList') {
            try {
                const futureContests = await fetchFutureContests();

                if (!futureContests || futureContests.length === 0) {
                    message.channel.send('No future contests found for now on Codeforces.');
                    return;
                }

                // Format and display the list of future contests
                const contestList = futureContests
                    .map((contest) => `**${contest.name}** - ${new Date(contest.startTimeSeconds * 1000).toLocaleString()}`)
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setTitle('Upcoming Codeforces Contests')
                    .setDescription(contestList)
                    .setColor('#00ff00');


                return message.channel.send({ embeds: [embed] });
            } catch (error) {
                // console.error('Error fetching future contests:', error);
                return message.channel.send('An error occurred while fetching future contests.');
            }
        }
        else if (args[0] == 'PNSB') {
            const mentionedUsers = message.mentions.users.map((user) => userHandles[user.id]).filter(Boolean);
            const rating = isInteger(args[args.length - 1]) ? parseInt(args[args.length - 1]) : null;

            if (!mentionedUsers || mentionedUsers.length === 0) {
                return message.channel.send('No users mentioned or handle(s) not found.');
            }

            try {
                console.log(mentionedUsers);
                const randomProblem = await fetchRandomUnsolvedProblem(mentionedUsers, rating);


                if (!randomProblem) {
                    message.channel.send('No problems found that match the criteria.');
                    return;
                }

                const problemLink = `https://codeforces.com/problemset/problem/${randomProblem.contestId}/${randomProblem.index}`;

                // Create an embed with the problem information
                const embed = new EmbedBuilder()
                    .setTitle(randomProblem.index + ' ' + randomProblem.name)
                    .addFields({ name: 'Rating', value: (randomProblem.rating).toString() })
                    .setColor('#00ff00')
                    .setURL(problemLink);

                return message.channel.send({ embeds: [embed] });

            } catch (error) {
                console.error('Error fetching random problem:', error);
                message.channel.send('An error occurred while fetching a random problem.');
            }
        }
        else {
            return message.reply('nonsensical to the bot');
        }
    }

    // show all commands 
    if (message.content.startsWith('!help')) {
        const commandList = 'The bot supports the following commands:\n' +
            '1. !time\n' +
            '2. !translate language_code text\n' +
            '3. !createpoll question, options\n' +
            '4. !avatar <mentionUser>\n' +
            '5. !ban <mentionUser>\n' +
            '6. !unban <username>\n' +
            '7. !search question\n' +
            '8. !bulkDelete <channelName>\n' +
            '9. !cf set handle_name\n' +
            '10. !cf get <mentionUser>\n' +
            '11. !cf plot <mentionUser>\n' +
            '12. !cf plot (for own rating plot)\n' +
            '13. !cf contestList\n' +
            '14. !cf PNSB <mentionUsers> <mentionRating> (PNSB- problem not solved by)\n' +
            '15. !help\n';

        message.reply(`\`\`\`${commandList}\`\`\``);
    }

})


client.on('guildMemberAdd', (member) => {
    const welcomeChannel = member.guild.channels.cache.find((ch) => ch.name === 'welcome');
    const readFirst = member.guild.channels.cache.find((ch) => ch.name === 'read-first');


    if (welcomeChannel) {
        welcomeChannel.send(`Hello ${member}, make sure to visit ${readFirst}`);
    }
});

const botToken = process.env.BOTTOKEN

client.login(botToken);





