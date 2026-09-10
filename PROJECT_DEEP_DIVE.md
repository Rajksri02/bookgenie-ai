# BookGenie AI: Technical Deep Dive

Use this document to review the architecture, decisions, and trade-offs of the BookGenie AI project. It is written to help you articulate your engineering decisions confidently in interviews.

---

## 1. One-Paragraph Purpose
**BookGenie AI** is a full-stack web application designed to help aspiring authors and content creators overcome writer's block by structuring the book-writing process. Instead of staring at a blank page, users provide high-level metadata (genre, tone, target audience), and the application uses Google's Gemini AI to first generate a structured chapter-by-chapter outline, and then sequentially generate the actual markdown content for each chapter. By breaking the intimidating task of "writing a book" into manageable, AI-assisted micro-steps—and providing robust PDF/DOCX exporting—it transforms a vague idea into a published manuscript.

---

## 2. Architecture Overview: End-to-End Flows

### Outline Generation
- **Trigger**: The user clicks "AI Generate Outline" in the frontend editor.
- **API**: A `POST` request is sent to `/api/books/:id/generate-outline`.
- **Controller (`book.controller.js`)**: The controller fetches the Book metadata from MongoDB.
- **AI Service (`geminiService.js`)**: It sends a highly structured prompt to the Gemini API, explicitly requesting the response in a JSON array format containing chapter titles and summaries.
- **Database**: Once the JSON is returned, the controller iterates over the array and inserts multiple `Chapter` documents into MongoDB, linking them to the Book's ObjectId.
- **Response**: The newly created chapters are returned to the React frontend, which updates the UI sidebar instantly.

### Chapter Content Generation
- **Trigger**: The user selects a specific chapter and clicks "Generate Content".
- **API**: A `POST` request is sent to `/api/chapters/:id/generate`.
- **Controller (`chapter.controller.js`)**: Updates the chapter `status` to `generating` in MongoDB. It passes the book's context (tone, audience) and the chapter's specific `summary` to the AI.
- **AI Service**: Gemini generates the long-form content in Markdown format.
- **Database**: The controller updates the Chapter document in MongoDB, saving the Markdown string to the `content` field and setting the status to `completed`.
- **Response**: The frontend receives the Markdown, and renders it visually using the `@uiw/react-md-editor` component.

### Authentication (Split Token Pattern)
- **Trigger**: User submits their email and password on the login page.
- **API**: `POST` to `/api/auth/login`.
- **Controller (`auth.controller.js`)**: Looks up the user by email in MongoDB. Uses `bcrypt` to compare the hashed password.
- **Tokens**: If successful, it generates *two* JSON Web Tokens (JWTs). The `refreshToken` is attached to the response as a secure `httpOnly` cookie. The `accessToken` is returned directly in the JSON response body.
- **Frontend Storage**: The React frontend stores the `accessToken` strictly in-memory (via a variable in `apiClient.js`), completely avoiding `localStorage`.
- **Silent Refresh Interceptor**: When the short-lived `accessToken` expires, API requests will return a `401 Unauthorized`. The Axios interceptor (`apiClient.js`) catches this, pauses the request, silently calls the `/api/auth/refresh` endpoint (which automatically sends the `httpOnly` refresh cookie), updates the in-memory access token, and retries the original request seamlessly.

### PDF/DOCX Export (Background Queue Architecture)
- **Trigger**: User clicks "Export PDF" or "Export DOCX" on the dashboard.
- **API**: `POST` to `/api/books/:id/export`.
- **Controller (`book.controller.js`)**: Creates a new `ExportJob` document in MongoDB with a status of `pending`. It then adds a new job to the `exportQueue` (backed by BullMQ + Redis) containing the `jobId` and format, and immediately returns a `202 Accepted` response.
- **Frontend Polling**: The React app immediately starts polling `/api/books/export/:jobId/status` every 1 second.
- **Background Worker (`export.queue.js`)**: A separate BullMQ worker process picks up the job from Redis. Concurrency is strictly limited to 2 to prevent memory spikes from headless browsers.
- **Service (`export.service.js`)**: Depending on the format, it either uses `puppeteer` to launch a headless Chromium browser to generate a heavily-styled PDF, or `docx` to construct a native Word document. It saves the file to `/uploads/exports` and updates the `ExportJob` in Mongo to `completed` with the file URL.
- **Completion**: The frontend polling receives the `completed` status, stops polling, and automatically triggers an invisible `<a>` tag click to download the file directly to the user's machine.

---

## 3. Data Model

The application uses MongoDB (via Mongoose) with a relational-style document structure.

### `User` Schema (`User.model.js`)
- **`name`, `email`, `password`**: Standard authentication fields. The password is automatically hashed via a Mongoose `pre('save')` hook using bcrypt.
- *Why it exists*: To securely isolate book data between different authors.

### `Book` Schema (`Book.model.js`)
- **`user`**: ObjectId referencing the User.
- **`title`, `subtitle`, `author`, `description`**: Core identity of the book.
- **`coverImage`**: A Cloudinary URL string for the uploaded book cover.
- **`topic`, `genre`, `tone`, `targetAudience`**: Crucial metadata fields. *Why?* These aren't just for display; they are dynamically injected into the Gemini AI prompts to ensure the generated content matches the author's vision.

### `Chapter` Schema (`Chapter.model.js`)
- **`book`**: ObjectId referencing the parent Book.
- **`title`, `summary`**: The structural outline of the chapter.
- **`content`**: The actual long-form text (stored as Markdown).
- **`order`**: Integer to maintain the sequence of chapters, since MongoDB doesn't guarantee document retrieval order.
- **`status`**: Enum (`draft`, `generating`, `completed`). *Why?* Allows the frontend to show loading spinners for specific chapters while they are being written by the AI.

---

## 4. Key Technical Decisions & The "Why"

*(Use these exact explanations in interviews)*

**Why a split Access-Token-in-Memory + Refresh-Token-Cookie pattern instead of storing the JWT in `localStorage`?**
> "I implemented a split token architecture for maximum security. Storing an Access Token in `localStorage` makes an application highly vulnerable to Cross-Site Scripting (XSS)—if a malicious script runs on the page, it can easily steal the token. Instead, I keep the short-lived Access Token strictly in-memory (in a JavaScript variable), making it immune to XSS, but it is wiped on page reload. To solve the page reload issue, I issue a long-lived Refresh Token stored in an `httpOnly` cookie. `httpOnly` cookies are completely invisible to client-side JavaScript, preventing theft. When the in-memory token is lost or expires, my Axios interceptor silently hits a `/refresh` endpoint using the secure cookie to get a new Access Token without interrupting the user's workflow."

**Why use structured JSON prompting for the AI outline?**
> "When asking the AI to generate an outline, if I just asked for text, I'd have to use brittle Regex to parse out chapter titles and summaries. Instead, I explicitly prompt the AI to return a strict JSON array. This guarantees I receive structured data that maps perfectly to my Mongoose `Chapter` schema, allowing me to do a clean `Chapter.insertMany()` without complex string parsing."

**Why use a Background Job + Polling for PDF Exports instead of a synchronous request?**
> "Generating a PDF with Puppeteer is a heavy, CPU-intensive task that takes several seconds. If I handled this synchronously, the HTTP request would likely hang and eventually timeout (especially on modern hosting platforms that cap requests at 10-30 seconds). By creating an `ExportJob` in Mongo and returning a Job ID immediately, the server is freed up. The client simply polls for the status, resulting in a much more resilient architecture and a better user experience."

**Why use Puppeteer for PDFs instead of a client-side library like jsPDF?**
> "Client-side PDF libraries often struggle with complex text layouts, page breaks, and rich CSS styling. Puppeteer spins up a real headless Chromium browser on the server. This means I can write standard HTML/CSS for the book layout—including page breaks, cover pages, and custom fonts—and Puppeteer renders it exactly as a browser would. It guarantees a high-quality, printable document."

**Why convert HEIC images to JPEG on the client side?**
> "Modern iPhones save photos in HEIC format, which standard web browsers cannot display natively. Instead of sending heavy, unsupported HEIC files to the server and wasting backend CPU cycles to convert them, I used the `heic-to` library on the frontend. This shifts the compute load to the user's device and ensures the server only ever deals with standard, web-safe JPEGs."

---

## 5. Known Limitations & Trade-offs
*A good engineer names their trade-offs confidently. Do not hide these; bring them up as "areas for future improvement."*

1. **TypeScript Migration is Infrastructure-Only:** The project is currently configured for TypeScript (tsconfig, packages), but the actual components and server files have not yet been migrated from `.js`/`.jsx` to `.ts`/`.tsx`. *Future fix: Incrementally migrate files to enforce type safety.*
2. **Local Redis Dependency for Development:** Because the export worker relies on BullMQ, developers must have a local Redis instance running to test PDF/DOCX exports. *Future fix: Containerize the entire development environment with Docker Compose.*
3. **Lack of AI Rate Limiting:** There is currently no strict rate limiting on the `/generate` endpoints. A malicious user could click "Generate" repeatedly, burning through our Gemini API quota. *Future fix: Implement `express-rate-limit` or a Redis-based token bucket to restrict AI generations per user per hour.*
4. **Markdown Storage limitations:** Storing content as Markdown is great for simplicity, but if multiple users wanted to collaboratively edit a chapter at the same time (like Google Docs), Markdown strings lead to merge conflicts. *Future fix: Moving to a block-based data structure (like Slate.js or TipTap JSON).*

---

## 6. Likely Interview Questions to Practice

**Architecture & Systems**
1. Walk me through what happens when a user clicks "Generate Outline"—from the browser click to the database save.
2. Why did you choose MongoDB for this project instead of a SQL database like PostgreSQL?
3. Why did you choose to use a background job queue (BullMQ + Redis) over plain async functions for document exports?
4. What testing strategy did you use for this application? Why did you choose `mongodb-memory-server` and mock external services like Gemini?
5. How do you ensure multi-tab support for local drafts before they are saved to the database? Walk me through the UUID + localStorage persistence pattern.

**Security & Auth**
6. Explain your authentication flow. Why did you use `httpOnly` cookies?
7. What is Cross-Site Scripting (XSS), and how does your architecture protect against it?
8. If I stole a user's JWT from their browser, what could I do with it? How do you mitigate that risk?

**AI & Prompting**
9. LLMs are notoriously unpredictable. How do you ensure the Gemini API returns data you can actually save to your database?
10. If the Gemini API goes down or takes 45 seconds to respond, how does your backend handle it? How does the frontend handle it?
11. How do you manage the context window? What if a book gets so long that sending previous chapters to the AI exceeds the token limit?

**Frontend & UX**
12. You have an image cropping feature. Walk me through how you take an image from a user's file system, crop it, and send it to your server.
13. Why compress images on the frontend before uploading?
14. How are you managing state in your React application? Did you use Redux, Context, or just local state, and why?

**Behavioral / Trade-offs**
15. What is the biggest technical debt in this codebase right now, and how would you prioritize fixing it?
