const mongoose = require('mongoose');
const Item = require('./Item');

const dvdSchema = new mongoose.Schema({
  
  director: { type: String, required: true }, 
  studio: String, 
  duration: String, 
  rating: String,   
  zone: String,     
  tmdb_id: Number, 
  format: { 
      type: String, 
      enum: ['dvd', 'bluray', '4k', 'vhs', 'laserdisc'],
      default: 'dvd'
  },
  
  is_boxset: { type: Boolean, default: false }
});


const Dvd = Item.discriminator('Dvd', dvdSchema);

module.exports = Dvd;