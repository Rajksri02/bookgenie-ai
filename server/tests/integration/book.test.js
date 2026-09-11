const request = require('supertest');
const app = require('../../index');
const User = require('../../src/models/User.model');
const Book = require('../../src/models/Book.model');
const Chapter = require('../../src/models/Chapter.model');

describe('Book & Chapter API Integration Tests', () => {
  let token;

  const testUser = {
    name: 'Author User',
    email: 'author@example.com',
    password: 'Password123!'
  };

  beforeAll(async () => {
    // Register user to get JWT token
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.accessToken;
  });

  describe('POST /api/books', () => {
    it('should create a new book with chapters', async () => {
      const bookData = {
        metadata: {
          title: 'My First AI Book',
          subtitle: 'A test book',
          author: 'Author User',
          description: 'A book about AI'
        },
        chapters: [
          { title: 'Chapter 1', summary: 'Intro' },
          { title: 'Chapter 2', summary: 'Body' }
        ]
      };

      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .send(bookData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBeTruthy();
      
      const createdBook = res.body.data.book;
      const createdChapters = res.body.data.chapters;
      expect(createdBook.title).toEqual(bookData.metadata.title);
      expect(createdChapters.length).toEqual(2);
      expect(createdChapters[0].title).toEqual('Chapter 1');
      expect(createdChapters[0].order).toEqual(0);
      expect(createdChapters[1].order).toEqual(1);
    });

    it('should fail if no auth token is provided', async () => {
      const res = await request(app).post('/api/books').send({});
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/books', () => {
    it('should retrieve books for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.data.length).toEqual(1);
      expect(res.body.data[0].title).toEqual('My First AI Book');
      expect(res.body.data[0].chapters.length).toEqual(2);
    });

    it('should return 401 for an invalid or expired JWT', async () => {
      const res = await request(app)
        .get('/api/books')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImlhdCI6MTIzNDU2Nzg5MH0.invalid_signature');
        
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBeFalsy();
    });
  });

  describe('PUT /api/books/:bookId/chapters/reorder', () => {
    let bookId;
    let chapters;

    beforeEach(async () => {
      const booksRes = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${token}`);
      
      bookId = booksRes.body.data[0]._id;
      chapters = booksRes.body.data[0].chapters;
    });

    it('should reorder chapters successfully', async () => {
      // Swap chapter 0 and 1
      const newOrderIds = [chapters[1]._id, chapters[0]._id];

      const res = await request(app)
        .put(`/api/books/${bookId}/chapters/reorder`)
        .set('Authorization', `Bearer ${token}`)
        .send({ chapterIds: newOrderIds });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();

      // Verify directly in DB
      const ch1 = await Chapter.findById(chapters[1]._id);
      const ch0 = await Chapter.findById(chapters[0]._id);
      
      expect(ch1.order).toEqual(0); // Moved to front
      expect(ch0.order).toEqual(1); // Moved to back
    });
  });

  describe('DELETE /api/books/:bookId', () => {
    let bookId;
    let chapters;

    beforeEach(async () => {
      const booksRes = await request(app)
        .get('/api/books')
        .set('Authorization', `Bearer ${token}`);
      
      bookId = booksRes.body.data[0]._id;
      chapters = booksRes.body.data[0].chapters;
    });

    it('should delete book and cascade delete all associated chapters', async () => {
      const res = await request(app)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();

      // Verify book is gone
      const bookInDb = await Book.findById(bookId);
      expect(bookInDb).toBeNull();

      // Verify chapters are gone
      const chaptersInDb = await Chapter.find({ book: bookId });
      expect(chaptersInDb.length).toEqual(0);
    });
  });
});
