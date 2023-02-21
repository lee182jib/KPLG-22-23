const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const Manager = require('./models/managers');
const morgan = require('morgan');


mongoose.connect('mongodb://localhost:27017/kpl-gazette', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

app.get('/home', async (req, res) => {
  const gameweekData = await axios.get(`https://fantasy.premierleague.com/api/bootstrap-static/`);
  const findCurrentGameweek = () => {
    for (let event of gameweekData.data.events) {
      if (event.is_current === true) {
        return event.id;
      }
    }
  }
  const currentGameweek = findCurrentGameweek();
  console.log(currentGameweek);

  res.render('home', { currentGameweek });
})

app.get('/gameweek/:gw', async (req, res) => {
  try {
    const { gw } = req.params
    const gameweekData = await axios.get(`https://fantasy.premierleague.com/api/leagues-h2h-matches/league/1006863/?event=${gw}`);
    const playerData = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');

    const playerDataGw = playerData.data.events[gw - 1];
    const players = playerData.data.elements;

    const mostSelectedCode = playerDataGw.most_selected;
    const mostTransferedIn = playerDataGw.most_transferred_in;
    const mostCaptained = playerDataGw.most_captained;

    const findPlayer = (selector) => {
      for (let player of players) {
        if (selector === player.id) {
          return player;
        }
      }
    }

    const findCurrentDeadline = () => {
      for (let event of playerData.data.events) {
        if (event.is_current === true) {
          return event.deadline_time;
        }
      }
    }
    const deadline = new Date(findCurrentDeadline());
    console.log(deadline);

    const foundMostTransferedIn = findPlayer(mostTransferedIn);
    const foundMostSelected = findPlayer(mostSelectedCode);
    const foundMostCaptained = findPlayer(mostCaptained);

    res.render('gameweek', { gameweekData, playerDataGw, foundMostSelected, foundMostCaptained, gw, foundMostTransferedIn });
  }
  catch (e) {
    res.send('Sorry, that did not work. The gameweek has not been played yet, or it might be something more complicated - ' + e)
  }
});

app.get('/stinkers', async (req, res) => {
  const playerData = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
  const players = playerData.data.elements
  const stinkPlayers = players.sort(function (a, b) {
    return b.transfers_out_event - a.transfers_out_event;
  });

  stinkPlayers.splice(10, stinkPlayers.length);
  stinkPlayers.reverse();

  res.render('stinkers', { stinkPlayers })
});

app.get('/davidmay', async (req, res) => {
  const playerData = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
  const players = playerData.data.elements;

  const getBest = (positionCode, amount) => {
    const playerPos = players.filter(p => p.element_type === positionCode);
    const playerPointOrder = playerPos.sort(function (a, b) {
      return b.total_points - a.total_points;
    })
    const bestPlayers = playerPointOrder.slice(0, amount);
    return bestPlayers;
  }

  const bestKeeper = getBest(1, 1);
  const bestDefenders = getBest(2, 3);
  const bestMidfielders = getBest(3, 4);
  const bestForwards = getBest(4, 2);

  const dmStats = [bestDefenders[0].total_points + 1, bestDefenders[0].clean_sheets + 1]

  res.render('davidmay', { bestKeeper, bestDefenders, bestMidfielders, bestForwards, dmStats })
});

app.get('/hipster', async (req, res) => {
  const playerData = await axios.get('https://fantasy.premierleague.com/api/bootstrap-static/');
  const players = playerData.data.elements;
  const { percent, zeroPercent } = req.query;

  let avPoints = 0;
  let percentAvgPoints = 0;

  zeroPercent ? console.log('the box is ticked') : console.log('the box is NOT ticked');

  // find high score for position
  const findHighScore = (positionCode) => {
    let position = players.filter(p => p.element_type === positionCode);
    position.sort(function (a, b) {
      return b.total_points - a.total_points
    });
    highestScore = position[0]
    return highestScore;
  }
  //find average score for each position
  const findAverageScore = (positionCode) => {
    const position = players.filter(p => p.element_type === positionCode);
    for (let p of position) {
      avPoints = avPoints += p.total_points;
    }
    avPoints = avPoints / position.length;
    return Math.round(avPoints);
  }
  // find average score withouy 0 scoring players
  const findZeroAverageScore = (positionCode) => {
    const position = players.filter(p => p.element_type === positionCode && p.total_points > 0);
    for (let p of position) {
      avPoints = avPoints += p.total_points;
    }
    avPoints = avPoints / position.length;
    return Math.round(avPoints);
  }
  //find hipster players
  const hipsterCalculator = (positionCode) => {
    const position = players.filter(p => p.element_type === positionCode);
    const filtPlayers = position.filter(p => p.selected_by_percent < Number(percent));
    filtPlayers.sort(function (a, b) {
      return b.total_points - a.total_points
    });
    return filtPlayers.splice(0, 5);
  }
  // find avg score for players of chosen %
  const findAvgHipScore = (positionCode) => {
    const position = players.filter(p => p.element_type === positionCode);
    const filtPlayers = position.filter(p => p.selected_by_percent < Number(percent));
    for (let f of filtPlayers) {
      percentAvgPoints = percentAvgPoints += f.total_points;
    }
    percentAvgPoints = percentAvgPoints / filtPlayers.length;
    return Math.round(percentAvgPoints)
  }

  const bestHipKeepers = hipsterCalculator(1);
  const bestHipDef = hipsterCalculator(2);
  const bestHipMid = hipsterCalculator(3);
  const bestHipFw = hipsterCalculator(4);

  const highScoreKeeper = findHighScore(1);
  const highScoreDef = findHighScore(2);
  const highScoreMid = findHighScore(3);
  const highScoreFw = findHighScore(4);

  const avScoreKeeper = findAverageScore(1);
  const avScoreDef = findAverageScore(2);
  const avScoreMid = findAverageScore(3);
  const avScoreFw = findAverageScore(4);

  const percentAvgKeeper = findAvgHipScore(1);
  const percentAvgDef = findAvgHipScore(2);
  const percentAvgMid = findAvgHipScore(3);
  const percentAvgFw = findAvgHipScore(4);

  const zeroPercentAvgKeeper = findZeroAverageScore(1);


  const passVars = { zeroPercentAvgKeeper, percentAvgKeeper, percentAvgDef, percentAvgMid, percentAvgFw, avScoreKeeper, avScoreDef, avScoreMid, avScoreFw, bestHipKeepers, bestHipDef, bestHipMid, bestHipFw, highScoreKeeper, highScoreDef, highScoreMid, highScoreFw, percent };

  res.render('hipster', passVars);
});



app.get('/monty', async (req, res) => {
  const quizData = await axios.get('https://opentdb.com/api.php?amount=10&category=21&type=boolean');
  const quiz = quizData.data.results;

  res.render('monty', { quiz })
});

app.get('/manager/', async (req, res) => {
  const managerData = await axios.get('https://fantasy.premierleague.com/api/entry/4309985/history/');
  const managers = await Manager.find({});

  const thisSeason = managerData.data.current;
  const seasonHistory = managerData.data.past;

  res.render('manager', { thisSeason, seasonHistory, managers });
})

app.get('/manager/:id', async (req, res) => {
  try {
    const { id } = req.params
    const managerData = await axios.get(`https://fantasy.premierleague.com/api/entry/${id}/history/`);
    const managers = await Manager.find({});
    const thisSeason = managerData.data.current;
    const seasonHistory = managerData.data.past;


    const findManager = () => {
      for (let manager of managers) {
        if (manager.id == id) {
          return manager;
        }
      }
    }
    const foundManager = findManager()

    res.render('manager', { thisSeason, seasonHistory, managers, id, foundManager });
  } catch (error) {
    console.log("something went wrong")
    console.log(error)
  }

})

app.use((err, req, res, next) => {
  console.log("*************************")
  console.log("**********ERROR**********")
  console.log("*************************");
  next(err);
})

app.use((req, res) => {
  res.send('NOT FOUND!')
})


app.listen(3000, () => {
  console.log('football time on port 3000');
});