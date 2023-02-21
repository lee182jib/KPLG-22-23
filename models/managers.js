const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const managersSchema = new Schema({
  name: String,
  initials: String,
  team: String,
  id: Number,
});

module.exports = mongoose.model('Manager', managersSchema);