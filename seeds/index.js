const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/kpl-gazette', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("CONNECTION OPEN")
  })
  .catch(err => {
    console.log("ERROR")
    console.log(err)
  })

  const managersSchema = new mongoose.Schema({
    name: String,
    initials: String,
    team: String,
    id: Number,
    leagueWin: Boolean
  });

const Manager = mongoose.model('Manager', managersSchema);

Manager.insertMany([
  { name: "Tony Nicklin", initials: 'tn', team:"Albion St Alligators", id: 4279358, leagueWin: true },
  { name: "Ben Woodall", initials: 'bw', team:"Bloxwich Broncos", id: 1297165, leagueWin: false },
  { name: "Phil Nicklin", initials: 'pn', team:"Featherstone Fire", id: 4295956, leagueWin: false },
  { name: "Chris Thompson", initials: 'ct', team:"Julian Jaguars", id: 4243912, leagueWin: true },
  { name: "Lee Woodall", initials: 'lw', team:"Lewis Lightning", id: 4309985, leagueWin: true },
  { name: "Daniel Picken", initials: 'dp', team:"Lunt Leopards", id: 4309464, leagueWin: false },
  { name: "Tom Westwood", initials: 'tw', team:"Prestwich Power", id: 47236, leagueWin: true },
  { name: "Chris Eddowes", initials: 'ce', team:"Purslet Panthers", id: 4260719, leagueWin: false },
  { name: "Daniel Huges", initials: 'dh', team:"Stourbridge Snakes", id: 4299798, leagueWin: false },
  { name: "Anthony Eddowes", initials: 'ae', team:"Stourbridge Stallions", id: 4259902, leagueWin: false },
  { name: "Phil Prescott", initials: 'pp', team:"Tonbridge Tigers", id: 4295795, leagueWin: true },
  { name: "Wayne Nicklin", initials: 'wn', team:"West Bromwich Wasps", id: 4262721, leagueWin: false }
])
  .then(data => {
    console.log("IT WORKED")
    console.log(data);
  })

