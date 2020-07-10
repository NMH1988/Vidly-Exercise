const mongoose = require('mongoose');
const request = require('supertest');
const moment = require('moment');
const { User } = require('../../models/user');
const { Rental } = require('../../models/rental');
const { Movie } = require('../../models/movie');
const { Genre } = require('../../models/genre');

describe('/api/returns', () => {
  let server;
  let customerId;
  let movieId;
  let token;
  let rental;
  let movie;
  let genre;

  const exec = async () => {
    return await request(server)
      .post('/api/returns')
      .set('x-auth-token', token)
      .send({ customerId, movieId });
  };

  beforeEach(async () => {
    server =  require('../../index');
    customerId = mongoose.Types.ObjectId();
    movieId = mongoose.Types.ObjectId();
    token = new User({ name: 'hoang', isAdmin: true }).generateAuthToken();

    genre = new Genre({ name: 'Lord of the ring' });

    await genre.save();

    movie = new Movie({
      _id: movieId,
      title: 'Love story',
      genre: {
        _id: genre._id,
        name: genre.name
      },
      numberInStock: 2,
      dailyRentalRate: 2
    });

    await movie.save();

    rental = new Rental({
      customer: {
        _id: customerId,
        name: 'Jack Sparrow',
        phone: '1234567'
      },
      movie: {
        _id: movieId,
        title: movie.title,
        dailyRentalRate: movie.dailyRentalRate
      }
    });

    await rental.save();
  });
  afterEach(async () => {
    await Rental.remove({});
    await Movie.remove({});
    await Genre.remove({});
    await server.close();
  });

  it('should return 401 if client is not logged in', async () => {
    token = '';
    const res = await exec();

    expect(res.status).toBe(401);
  });
  it('should return 400 if customerId is not provided', async () => {
    customerId = '';
    const res = await exec();

    expect(res.status).toBe(400);
  });
  it('should return 400 if movieId is not provided', async () => {
    movieId = '';
    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 404 if no rental found for the customer and movie', async () => {
    await Rental.remove({});

    const res = await exec();

    expect(res.status).toBe(404);
  });

  it('should return 400 if the rental already processed', async () => {
    rental.dateReturned = new Date();
    await rental.save();

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 200 if the input is valid', async () => {
    const res = await exec();

    expect(res.status).toBe(200);
  });

  it('should set the return day if input is valid', async () => {
    await exec();

    const rentalInDb = await Rental.findById(rental._id);
    const diff = new Date() - rentalInDb.dateReturned;

    expect(diff).toBeLessThan(10 *1000);
  });

  it('should calculate the rental fee if the input is valid', async () => {
    rental.dateOut = moment().add(-7, 'days').toDate();

    await rental.save();

    await exec();

    const rentalInDb = await Rental.findById(rental._id);

    expect(rentalInDb.rentalFee).toBe(14);
  });

  it('should increase the stock', async () => {
    await exec();

    const movieInDb = await Movie.findById(movieId);

    expect(movieInDb.numberInStock).toBe(1);
  });

  it('should return the rental if the input is valid', async () => {
    const res = await exec();

    await Rental.findById(rental._id);

    expect(Object.keys(res.body))
      .toEqual(expect.arrayContaining(['dateOut', 'dateReturned', 'rentalFee', 'customer', 'movie']));
  });
});