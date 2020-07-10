const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
//Joi.objectId = require('joi-objectid')(Joi);
const { Rental } = require('../models/rental');
const { Movie } = require('../models/movie');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.post('/', [auth, admin], async (req, res) => {
  if (!req.body.customerId) return res.status(400).send('Customer Id not found');
  if (!req.body.movieId) return res.status(400).send('Movie Id not found');
/*  const { error } = validateReturn(req.body);

  if (error) return res.status(400).send(error.details[0].message);*/

  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);

  if (!rental) return res.status(404).send('Rental not found');
  if (rental.dateReturned) return res.status(400).send('Date return is processed');

  rental.return();

  await rental.save();

  await Movie.update({ _id: req.body.movieId }, { $inc: { numberInStock: - 1 } });

  return res.send(rental);
});

function validateReturn(request) {
  const schema = Joi.object({
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required()
  });

  return schema.validate(request);
}

module.exports = router;