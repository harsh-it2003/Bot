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


// checks if the string is integer
function isInteger(str) {
    // Regular expression to match integers (with optional negative sign)
    const integerPattern = /^-?\d+$/;

    // Test if the string matches the integer pattern
    return integerPattern.test(str);
}


// stop the execution further for ms time
async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}



// for fetching the last submission of a user
async function fetchLastSubmission(userHandle) {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${userHandle}&from=1&count=1`);
        const submissions = response.data.result;

        if (submissions.length === 0) {
            // User has no submissions
            return null;
        }

        const lastSubmission = submissions[0];
        return lastSubmission;
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        return null;
    }
}


// for plotting the graph using the data 
async function plotGraph(data, username) {
    const labels = data.map((entry) => entry.x.toLocaleDateString());
    const chart = new QuickChart();

    await chart
        .setConfig({
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: username,
                        data: data.map((entry) => entry.y),
                        borderColor: 'rgba(75, 192, 192, 1)',
                    },
                ],
            },
        })

    // console.log(chart.getShortUrl());

    return chart.getShortUrl();
}


// for fetching future contests on codeforces
async function fetchFutureContests() {
    try {
        const response = await axios.get('https://codeforces.com/api/contest.list');
        const contests = response.data.result;
        const futureContests = contests.filter((contest) => contest.phase === 'BEFORE');

        return futureContests;
    } catch (error) {
        console.error('Error fetching future contests:', error);
        return [];
    }
}


// function to fetch the problem set with the given rating from Codeforces
async function fetchProblemSet(rating) {
    try {
        const response = await axios.get('https://codeforces.com/api/problemset.problems');
        const problems = response.data.result.problems;

        const problemsWithRating = rating
            ? problems.filter((problem) => problem.rating === rating)
            : problems;

        return problemsWithRating;
    } catch (error) {
        console.error('Error fetching problem set:', error);
        return [];
    }
}


// return unsolved problems by the specified users and of certain rating
async function fetchRandomUnsolvedProblem(users, rating) {
    const problemsWithRating = await fetchProblemSet(rating);

    const unsolvedProblems = problemsWithRating.filter((problem) => {
        return (
            !users.some((user) => problem.solved_by && problem.solved_by.some((handle) => handle === user))
        );
    });

    if (unsolvedProblems.length === 0) {
        return null; // No unsolved problems found
    }

    const randomIndex = Math.floor(Math.random() * unsolvedProblems.length);
    return unsolvedProblems[randomIndex];
}


module.exports = { isInteger, delay, fetchLastSubmission, fetchLastSubmission, fetchProblemSet, fetchRandomUnsolvedProblem, plotGraph }






