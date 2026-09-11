const request = require('supertest');
const app = require('../../index');
const User = require('../../src/models/User.model');
const Book = require('../../src/models/Book.model');
const Chapter = require('../../src/models/Chapter.model');
const geminiService = require('../../src/services/geminiService');

// Mock geminiService methods
jest.mock('../../src/services/geminiService', () => ({
  generateOutline: jest.fn(),
  generateChapterStream: jest.fn(),
  regenerateSingleChapter: jest.fn(),
}));

describe('AI Outline API Integration Tests', () => {
  let token;
  let user;

  const testUser = {
    name: 'AI Test User',
    email: 'aitest@example.com',
    password: 'Password123!'
  };

  beforeAll(async () => {
    // Register user to get JWT token
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.accessToken;
    user = await User.findOne({ email: testUser.email });
  });

  describe('POST /api/ai/outline', () => {
    it('should generate an outline and create book with chapters (Mocked AI)', async () => {
      
      const mockOutlineResponse = {
        title: 'The Great AI Novel',
        subtitle: 'A mocked journey',
        chapters: [
          { title: 'The Mock Beginning', summary: 'Starts here', estimatedWords: 1500 },
          { title: 'The Mock End', summary: 'Ends here', estimatedWords: 2000 }
        ]
      };
      
      // Setup the mock to return our fake outline
      geminiService.generateOutline.mockResolvedValue(mockOutlineResponse);

      const requestBody = {
        topic: 'AI taking over',
        genre: 'Sci-Fi',
        tone: 'Suspenseful',
        targetChapterCount: 2,
        audience: 'Adults'
      };

      const res = await request(app)
        .post('/api/ai/outline')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBeTruthy();
      
      expect(geminiService.generateOutline).toHaveBeenCalledWith({
        topic: requestBody.topic,
        genre: requestBody.genre,
        tone: requestBody.tone,
        targetChapterCount: requestBody.targetChapterCount,
        audience: requestBody.audience
      });

      const bookResponse = res.body.data.book;
      const chaptersResponse = res.body.data.chapters;

      expect(bookResponse.title).toEqual(mockOutlineResponse.title);
      expect(chaptersResponse.length).toEqual(2);
      expect(chaptersResponse[0].title).toEqual('The Mock Beginning');
      expect(chaptersResponse[1].title).toEqual('The Mock End');

      // Verify in DB directly
      const bookInDb = await Book.findById(bookResponse._id);
      expect(bookInDb.title).toEqual('The Great AI Novel');
      
      const chaptersInDb = await Chapter.find({ book: bookInDb._id });
      expect(chaptersInDb.length).toEqual(2);
    });
  });
});
