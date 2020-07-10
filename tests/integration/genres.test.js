let server;
const mongoose = require('mongoose');
const request = require('supertest');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');

describe('/api/genres', () => {
  beforeEach(() => {
    server = require('../../index');
  });
  afterEach(async () => {
    await server.close();
    await Genre.remove({});
  });
  describe('GET /', () => {
    it('should return all genres', async () => {
      await Genre.collection.insertMany([
        { name: 'genre1' },
        { name: 'genre2' }
      ]);
      const res = await request(server).get('/api/genres');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.name === 'genre1')).toBeTruthy();
      expect(res.body.some((g) => g.name === 'genre2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('should return a genre if valid id is passed', async () => {
      const genre = new Genre({ name: 'genre1' });
      await genre.save();

      const res = await request(server).get('/api/genres/' + genre._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', genre.name);
    });
    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/genres/1');

      expect(res.status).toBe(404);
    });
  });
  describe('POST /', () => {
    let token;
    let name;
    const exec = async () => {
      return await request(server)
        .post('/api/genres')
        .set('x-auth-token', token)
        .send({ name });
    };

    beforeEach(() => {
      token = new User({ name: 'hoang', isAdmin: true }).generateAuthToken();
      name = 'genre6';
    });

    it('should return 401 if the client is not logged in', async () => {
      token = '';
      const res = await exec();
      expect(res.status).toBe(401);
    });
    it('should return 400 if the genre less than 3 character', async () => {
      name = 'ge';
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it('should save the genre if the new genre is valid', async () => {
      token = new User({ name: 'hoang', isAdmin: true }).generateAuthToken();
      const res = await exec();
      const genre = await Genre.find({ name: 'genre6' });
      expect(genre).not.toBeNull();
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', 'genre6');
    });
  });
  describe('PUT /:id', () => {
    let token;
    let genre;
    let newName;
    let id;
    const exec = async () => {
      return await request(server)
        .put('/api/genres/' + id)
        .set('x-auth-token', token)
        .send({ name: newName });
    };

    beforeEach(async () => {
      genre = new Genre({ name: 'genre1' });
      await genre.save();

      token = new User({ name: 'Hoang', isAdmin: true }).generateAuthToken();
      id = genre._id;
      newName = 'genre9';
    });

    it('should return 401 if client not login', async () => {
      token = '';
      const result = await exec();

      expect(result.status).toBe(401);
    });

    it('should return 400 if the name of genre is less than 5 character', async () => {
      newName = 'gen';
      const result = await exec();

      expect(result.status).toBe(400);
    });
    it('should return 404 if the Id could not be found', async () => {
      id = mongoose.Types.ObjectId();
      const result = await exec();
      expect(result.status).toBe(404);
    });
    it('should return 404 if id is invalid', async () => {
      id = 1;
      const result = await exec();
      expect(result.status).toBe(404);
    });
    it('should return 400 if name of genre is more than 50 character', async () => {
      newName = new Array(52).join('a');

      const result = await exec();
      expect(result.status).toBe(400);
    });
    it('should return updated genre if input is valid', async () => {
      await exec();
      const updatedGenre = await Genre.findById(genre._id);
      expect(updatedGenre.name).toBe(newName);
    });
    it('should return the updated genre if it is valid', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', newName);
    });
  });
  describe('DELETE /:id', () => {
    let token;
    let genre;
    let id;

    const exec = async () => {
      return await request(server)
        .delete('/api/genres/' + id)
        .set('x-auth-token', token)
        .send();
    };
    beforeEach(async () => {
      genre = new Genre({ name: 'genre6' });
      await genre.save();

      id = genre._id;
      token = await new User({ name: 'hoang', isAdmin: true }).generateAuthToken();
    });

    it('should return 401 if the client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });
    it('should return 403 if the client is not an admin', async () => {
      token = await new User({ name: 'Hoang', isAdmin: false }).generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });
    it('should return 404 if the id is not valid', async () => {
      id = 2;

      const res = await exec();

      expect(res.status).toBe(404);
    });
    it('should return 404 if the genre could not be found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });
    it('should delete genre if the input is valid', async () => {
      await exec();

      const genre = await Genre.findById(id);

      expect(genre).toBeNull();
    });
  });
});