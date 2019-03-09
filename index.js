//This is a comment.

require('dotenv').config()
const Discord = require('discord.js')
//const client = new Discord.Client()
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL'] });
const fs = require("fs");
const adminUsername = 'Riz';
const allowedChannelID = "552679725269647370";
// Dan Test Channel: "551457203635224629"
// PandaPoints Channel: "552679725269647370"


function getScoreObj(){
    var scoreFile = fs.readFileSync('points.json');
    var scoreObj = JSON.parse(scoreFile);
    return scoreObj;
}

function getScore(scoreObject, username){
    for (var i = 0; i < scoreObject.users.length; i++) {
        if (scoreObject.users[i].name === username){
            return scoreObject.users[i].score;
        }
    }
    return null;
}

function saveScores(scoreObject){
    var users = scoreObject.users;
    users.sort(
        function(user1, user2){ 
            return user2.score - user1.score; 
        }
    );
    fs.writeFileSync('points.json', JSON.stringify(scoreObject));
}

function getAllScores(scoreObject){
    var leaderboard = "";
    for (var i = 0; i < scoreObject.users.length; i++) {
        var user = scoreObject.users[i];
        leaderboard += user.name + " : " + user.score + " points\n";
    }
    return leaderboard;
}

function addPoints(msg, points){
    var scoreObj = getScoreObj();
    for (var i = 0; i < scoreObj.users.length; i++) {
        if (scoreObj.users[i].name === msg.author.username){
            scoreObj.users[i].score += points;
        }
    }   
    saveScores(scoreObj);
}

function userExists(userName){
    var scoreObj = getScoreObj();
    for (var i = 0; i < scoreObj.users.length; i++) {
        if (scoreObj.users[i].name === userName){
            return true;
        }
    }
    return false;
}

function addNewUser(userName){
    var scoreObj = getScoreObj();
    var newUser = {name:userName, score:0};
    scoreObj.users.push(newUser);
    saveScores(scoreObj);
}

function checkForAndAddNewUser(msg, senderUsername){
    if (!userExists(senderUsername)){
        addNewUser(senderUsername);
        msg.channel.send("Wow, " + senderUsername + "'s first points!");
    }
}

function removeUser(msg, username){
    var scoreObj = getScoreObj();
    var removed = false;
    for (var i = 0; i < scoreObj.users.length; i++) {
        if (scoreObj.users[i].name === username){
            msg.channel.send("Removed user " + username + " from PandaPoints leaderboard. "
                + "They had " + scoreObj.users[i].score + " points.");
            scoreObj.users.splice(i, 1);
            removed = true;
        }
    }
    saveScores(scoreObj);
    if (!removed) {
        msg.channel.send("No user named " + username + " found in the leaderboard.");
    }
}

function setScore(msg, username, score){
    if (!userExists(username)){
        addNewUser(username);
        msg.channel.send("Wow, " + username + "'s first points! Total: " 
            + score);
    }
    var scoreObj = getScoreObj();
    for (var i = 0; i < scoreObj.users.length; i++) {
        if (scoreObj.users[i].name === username){
            scoreObj.users[i].score = score;
        }
    } 
    saveScores(scoreObj);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
    console.log(msg.channel.id);
  if (msg.channel.id == allowedChannelID){
      if(msg.author.bot) return;
      else if (msg.content === '!leaderboard') {
        msg.channel.send("PandaPoints Totals:\n\n" + getAllScores(getScoreObj()));
      }
      else if (msg.content.startsWith('!removeUser')) {
        if (msg.author.username == adminUsername){
            var prefix = "!removeUser";
            const args = msg.content.slice(prefix.length).trim().split(/ +/g);
            //const command = args.shift().toLowerCase();
            if (!(args.length == 1)){
                msg.channel.send("Incorrect number of !removeUser arguments.");
            } else {
                removeUser(msg, args[0]);
            }
        } else {
             msg.channel.send("C'mon now, you know only the head Panda can do that!");
        }
      } 
      else if (msg.content.startsWith('!setScore')) {
        if (msg.author.username == adminUsername){
            var prefix = "!setScore";
            const args = msg.content.slice(prefix.length).trim().split(/ +/g);
            //const command = args.shift().toLowerCase();
            if (!(args.length == 2)){
                msg.channel.send("Incorrect number of !setScore arguments.")
            } else if (typeof args[0] != 'string' || isNaN(parseInt(args[1]))){
                msg.channel.send(
                    "!setScore arguments are of incorrect type. Must be a name followed by a number.");
            }
            else {
                setScore(msg, args[0], parseInt(args[1]));
                msg.channel.send("Score set to " + args[1] + " for " + args[0]);
            }
        } else {
             msg.channel.send("C'mon now, you know only the head Panda can do that!");
        }
      }
      else if (msg.content === '!commands'){
        msg.channel.send(
            "Admin Commands:\n" +
            "!setScore (username) (score) : sets an existing user's score directly\n" +
            "!removeUser (username) : removes an existing user from the PandaPoints leaderboard\n\n" + 
            "Reacting to a message with a number emoji will add that many points to the message sender's score.\n" +
            "Users will be added to the leaderboard automatically when recieving their first points.\n\n" +
            "General Commands:\n !leaderboard : view the overall PandaPoints leaderboard"
        );
      }
      else if(msg.content.startsWith("!")){
        msg.channel.send("Unknown command. Try !commands for list of commands.");
      }
  }
})

/*
var PointIds = {

     "1%E2%83%A3"  : 1,
     "sdafsdf" : 2
}
*/

client.on('messageReactionAdd', async (reaction, user) => {
    var senderUsername = reaction.message.author.username;
    if (reaction.emoji.name === '💯'){     
                reaction.message.channel.send("Keep it 💯 Pandas.");
    }
    else if (reaction.message.channel.id == allowedChannelID){
        if(user.username == adminUsername){
            /*
            var points = PointIds[reaction.emoji.identifier];
            addPoints(reaction.message, points);
            */

            checkForAndAddNewUser(reaction.message, senderUsername);
            if (reaction.emoji.identifier === "1%E2%83%A3"){
                addPoints(reaction.message, 1);
                reaction.message.channel.send('Yay! Added 1 point to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "2%E2%83%A3"){
                addPoints(reaction.message, 2);
                reaction.message.channel.send('Yay! Added 2 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "3%E2%83%A3"){
                addPoints(reaction.message, 3);
                reaction.message.channel.send('Yay! Added 3 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "4%E2%83%A3"){
                addPoints(reaction.message, 4);
                reaction.message.channel.send('Yay! Added 4 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "5%E2%83%A3"){
                addPoints(reaction.message, 5);
                reaction.message.channel.send('Yay! Added 5 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "6%E2%83%A3"){
                addPoints(reaction.message, 6);
                reaction.message.channel.send('Yay! Added 6 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "7%E2%83%A3"){
                addPoints(reaction.message, 7);
                reaction.message.channel.send('Yay! Added 7 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "8%E2%83%A3"){
                addPoints(reaction.message, 8);
                reaction.message.channel.send('Yay! Added 8 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "9%E2%83%A3"){
                addPoints(reaction.message, 9);
                reaction.message.channel.send('Yay! Added 9 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.name === '💯'){     
                reaction.message.channel.send("Keep it 💯 Pandas.");
            } else {
                reaction.message.channel.send("Hold up Panda, I don't know how to react to that reaction.");
            }
        } 
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.message.channel.id == allowedChannelID){
        if(user.username == adminUsername){
            var senderUsername = reaction.message.author.username;
            checkForAndAddNewUser(reaction.message, senderUsername);
            if (reaction.emoji.identifier === "1%E2%83%A3"){
                addPoints(reaction.message, -1);
                reaction.message.channel.send('Aww, removed 1 point to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "2%E2%83%A3"){
                addPoints(reaction.message, -2);
                reaction.message.channel.send('Aww, removed 2 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "3%E2%83%A3"){
                addPoints(reaction.message, -3);
                reaction.message.channel.send('Aww, removed 3 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "4%E2%83%A3"){
                addPoints(reaction.message, -4);
                reaction.message.channel.send('Aww, removed 4 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "5%E2%83%A3"){
                addPoints(reaction.message, -5);
                reaction.message.channel.send('Aww, removed 5 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "6%E2%83%A3"){
                addPoints(reaction.message, -6);
                reaction.message.channel.send('Aww, removed 6 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "7%E2%83%A3"){
                addPoints(reaction.message, -7);
                reaction.message.channel.send('Aww, removed 7 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "8%E2%83%A3"){
                addPoints(reaction.message, -8);
                reaction.message.channel.send('Aww, removed 8 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            } else if (reaction.emoji.identifier === "9%E2%83%A3"){
                addPoints(reaction.message, -9);
                reaction.message.channel.send('Aww, removed 9 points to ' + senderUsername + 
                    "'s score. Total: " + getScore(getScoreObj(), senderUsername));
            }
        }
    }
});

/*
client.on('messageReactionAdd', async function (reaction, user) {
  // If the message is partial, the only accessible property is its id
  if (reaction.message.partial) await reaction.message.fetch();
  // The message is now fully available
  console.log(reaction.message.id + ' : ' + user.username);
  if (reaction.emoji.name === '💯'){     
    addPoint(reaction.message, 1);
    reaction.message.reply('Added a point with a reaction.');
  }
});


client.on('messageReactionAdd', async (reaction, user) => {
  // If a message gains a reaction and it is uncached, fetch and cache the message
  // You should account for any errors while fetching, it could return API errors if the resource is missing
  if (reaction.message.partial) await reaction.message.fetch();
  // Now the message has been cached and is fully available:
  console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
});
*/

client.login(process.env.BOT_TOKEN);