const mongoose = require('mongoose');
const Joi = require('@hapi/joi');
const passwordComplexity = require('joi-password-complexity');
const jwt = require('jsonwebtoken');
const config = require('config');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 5,
    maxlength: 50,
    required: true
  },
  password: {
    type: String,
    minlength: 5,
    maxlength: 255,
    required: false,
    unique: true
  },
  email: {
    type: String,
    minlength: 10,
    maxlength:255,
    required: true,
    unique: true
  },
  isAdmin: Boolean,
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey'));
};
const User = mongoose.model('User', userSchema);

function userValidate(user) {
  const complexityOptions = {
    min: 5,
    max: 255,
    lowerCase: 1,
    upperCase: 1,
    numeric: 3,
    symbol: 0,
    requirementCount: 5,
  };
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    password: passwordComplexity(complexityOptions),
    email: Joi.string().min(10).max(255).required().email()
  });

  return schema.validate(user);
}

exports.User = User;
exports.validate = userValidate;