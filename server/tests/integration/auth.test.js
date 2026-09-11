const request = require('supertest');
const app = require('../../index');
const User = require('../../src/models/User.model');

jest.mock('../../src/services/emailService', () => jest.fn().mockResolvedValue(true));
const sendEmail = require('../../src/services/emailService');

describe('Auth API Integration Tests', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data.email).toEqual(testUser.email);
      expect(res.body.accessToken).toBeDefined();

      // Verify user actually got saved to DB
      const userInDb = await User.findOne({ email: testUser.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb.name).toEqual(testUser.name);
    });

    it('should fail if email is already taken', async () => {
      // Seed the DB first
      await request(app).post('/api/auth/register').send(testUser);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBeFalsy();
      expect(res.body.error.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.data.email).toEqual(testUser.email);
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBeFalsy();
      expect(res.body.error.message).toBe('Incorrect password. Please try again.');
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
      sendEmail.mockClear();
    });

    it('should generate a reset token and send email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(sendEmail).toHaveBeenCalledTimes(1);

      const emailCallArgs = sendEmail.mock.calls[0][0];
      expect(emailCallArgs.email).toEqual(testUser.email);
      expect(emailCallArgs.message).toContain('reset-password');
    });

    it('should successfully reset password with valid token', async () => {
      // 1. Request forgot password
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      const emailCallArgs = sendEmail.mock.calls[0][0];
      // Extract the resetUrl from the message
      const resetUrl = emailCallArgs.message.match(/http[^\s]+/)[0];
      const token = resetUrl.split('/').pop();

      // 2. Use the token to reset the password
      const newPassword = 'NewPassword123!';
      const res = await request(app)
        .put(`/api/auth/reset-password/${token}`)
        .send({ password: newPassword });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.accessToken).toBeDefined();

      // 3. Verify old password fails and new password works
      const loginFail = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(loginFail.statusCode).toEqual(401);

      const loginSuccess = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: newPassword });
      expect(loginSuccess.statusCode).toEqual(200);
    });

    it('should fail reset with invalid or expired token', async () => {
      const res = await request(app)
        .put(`/api/auth/reset-password/invalid-token-string`)
        .send({ password: 'NewPassword123!' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBeFalsy();
      expect(res.body.error.message).toBe('Invalid or expired token');
    });
  });
});
