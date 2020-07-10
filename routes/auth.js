const express = require('express');
const Joi = require('@hapi/joi');
const passwordComplexity = require('joi-password-complexity');
const router = express.Router();
const bcrypt= require('bcrypt');
const { User } = require('../models/user');

router.post('/', async (req, res) => {

  const { error } = authValidate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(400).send('Email and Password invalid');

  const valid = await bcrypt.compare(req.body.password, user.password);

  if (!valid) return res.status(400).send('Email and Password invalid');

  const token  = user.generateAuthToken();
  res.send(token);
});

function authValidate(req) {
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
    email: Joi.string().min(10).max(255).required().email(),
    password: passwordComplexity(complexityOptions)
  });

  return schema.validate(req);
}

module.exports = router;