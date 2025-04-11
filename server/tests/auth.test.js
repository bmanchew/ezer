const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Mock User model
jest.mock('../models/User');

describe('Auth Routes', () => {
  let token;
  
  beforeEach(() => {
    // Create a test token
    token = jwt.sign({ user: { id: '123' } }, process.env.JWT_SECRET || 'testsecret');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);
      
      // Mock User.create to return a new user
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        save: jest.fn().mockResolvedValue(true)
      };
      User.create.mockResolvedValue(mockUser);
      
      // Mock bcrypt.genSalt and bcrypt.hash
      bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');
      
      // Mock jwt.sign
      jwt.sign = jest.fn().mockImplementation((payload, secret, options, callback) => {
        callback(null, 'testtoken');
      });
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('name');
      expect(res.body.user).toHaveProperty('email');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 400 if user already exists', async () => {
      // Mock User.findOne to return a user (user exists)
      User.findOne.mockResolvedValue({
        id: '123',
        name: 'Test User',
        email: 'test@example.com'
      });
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('msg', 'User already exists');
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: 'pass'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user and return token', async () => {
      // Mock User.findOne to return a user
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare to return true
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      
      // Mock jwt.sign
      jwt.sign = jest.fn().mockImplementation((payload, secret, options, callback) => {
        callback(null, 'testtoken');
      });
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should return 400 if user does not exist', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('msg', 'Invalid credentials');
    });

    it('should return 400 if password is incorrect', async () => {
      // Mock User.findOne to return a user
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare to return false (password doesn't match)
      bcrypt.compare = jest.fn().mockResolvedValue(false);
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('msg', 'Invalid credentials');
    });
  });

  describe('GET /api/auth', () => {
    it('should return authenticated user', async () => {
      // Mock User.findByPk to return a user
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com'
      };
      User.findByPk.mockResolvedValue(mockUser);
      
      const res = await request(app)
        .get('/api/auth')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '123');
      expect(res.body).toHaveProperty('name', 'Test User');
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('msg', 'No token, authorization denied');
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth')
        .set('x-auth-token', 'invalidtoken');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('msg', 'Token is not valid');
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should update user password', async () => {
      // Mock User.findByPk to return a user
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        save: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare to return true
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      
      // Mock bcrypt.genSalt and bcrypt.hash
      bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
      bcrypt.hash = jest.fn().mockResolvedValue('newhashedpassword');
      
      const res = await request(app)
        .put('/api/auth/password')
        .set('x-auth-token', token)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('msg', 'Password updated successfully');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 400 if current password is incorrect', async () => {
      // Mock User.findByPk to return a user
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      User.findByPk.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare to return false (password doesn't match)
      bcrypt.compare = jest.fn().mockResolvedValue(false);
      
      const res = await request(app)
        .put('/api/auth/password')
        .set('x-auth-token', token)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('msg', 'Current password is incorrect');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      // Mock User.findOne to return null (no other user with same email)
      User.findOne.mockResolvedValue(null);
      
      // Mock User.findByPk to return a user
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        save: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({
        id: '123',
        name: 'Updated User',
        email: 'updated@example.com'
      });
      
      const res = await request(app)
        .put('/api/auth/profile')
        .set('x-auth-token', token)
        .send({
          name: 'Updated User',
          email: 'updated@example.com'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name', 'Updated User');
      expect(res.body).toHaveProperty('email', 'updated@example.com');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 400 if email is already in use', async () => {
      // Mock User.findOne to return a user (email already in use)
      User.findOne.mockResolvedValue({
        id: '456',
        name: 'Another User',
        email: 'updated@example.com'
      });
      
      const res = await request(app)
        .put('/api/auth/profile')
        .set('x-auth-token', token)
        .send({
          name: 'Updated User',
          email: 'updated@example.com'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('msg', 'Email is already in use');
    });
  });
});
