const mongoose = require('mongoose');
const {chain} = require('./settings.json')

const VolumeSchema = new mongoose.Schema({
    marketId: Number,
    volume: Number,
    floor: Number,
    timestamp: { type: Date, default: Date.now }
});

const Volume = mongoose.model(`${chain}_market_volume`, VolumeSchema);

module.exports = Volume