const mongoose = require('mongoose');
const Item = require('./Item');

const bookSchema = new mongoose.Schema({
  author: { type: String, required: true },
  publisher: String,
  isbn: String,
  pages: Number,
  language: String,
  format: { 
      type: String, 
      enum: ['hardcover', 'paperback', 'manga', 'comic'],
      default: 'paperback'
  },
  series: String,
  volume: Number
});

const Book = Item.discriminator('Book', bookSchema);
module.exports = Book;