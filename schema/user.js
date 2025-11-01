const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    userId: String,
    username: String,
    email: String,
    avatar: String,
    password: String,
    birthdate: Date,
    registeredAt: Date,
    salary: Number
});
module.exports = mongoose.model('User', userSchema);