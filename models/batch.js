const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    type: String,
    members: [
      {
        name: String,
        email: String,
        age: Number
      }
    ],
    count: Number,
  },
  { timestamps: true }
);

const Batch = mongoose.model('batch', schema)

module.exports = Batch;