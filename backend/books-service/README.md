# Books Service

Microservice for managing books, user libraries, bookclub books, reading progress, and book suggestions.

## Features

- ✅ **Book Search** - Search and get details from Google Books API
- ✅ **User Books** - Personal library management
- ✅ **BookClub Books** - Manage books for bookclubs
- ✅ **Reading Progress** - Track reading progress and reviews
- ✅ **Book Suggestions** - Suggest and vote on books for bookclubs
- ✅ **Security** - Helmet security headers, rate limiting
- ✅ **Monitoring** - Prometheus metrics endpoint
- ✅ **Testing** - 25 unit tests + 37 integration tests

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev

# Run tests
npm run test:unit           # Unit tests (no DB needed)
npm run test:integration    # Integration tests (requires DB)
```

## Environment Variables

See [`.env.example`](.env.example) for required variables:

- `PORT` - Server port (default: 3002)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT authentication
- `GOOGLE_BOOKS_API_KEY` - Google Books API key
- `LOG_LEVEL` - Logging level (info, debug, error)

## Security & Performance

### Rate Limiting

Handled at **API Gateway** level:

- **Gateway**: 1000 requests per 15 minutes (Redis-backed)
- All traffic flows through gateway for consistent rate limiting

### Security Headers

Uses `helmet` for:

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### Monitoring

Prometheus metrics available at `/metrics`:

- HTTP request duration
- Request count by endpoint
- Active connections
- System metrics (CPU, memory)

## Project Structure

```
src/
├── config/
│   └── database.ts        # Prisma database configuration
├── controllers/
│   ├── bookSearchController.ts
│   ├── userBooksController.ts
│   ├── bookClubBooksController.ts
│   ├── readingProgressController.ts
│   └── bookSuggestionsController.ts
├── middleware/
│   ├── authMiddleware.ts
│   └── errorHandler.ts
├── routes/
│   ├── bookSearchRoutes.ts
│   ├── userBooksRoutes.ts
│   ├── bookClubBooksRoutes.ts
│   ├── readingProgressRoutes.ts
│   └── bookSuggestionsRoutes.ts
├── utils/
│   ├── logger.ts
│   └── validation.ts
└── index.ts               # Application entry point
```

## API Endpoints

### System

- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics

### Book Search (Public)

**Search Books**

```http
GET /v1/books/search?q=javascript&limit=20
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "googleBooksId": "abc123",
      "title": "JavaScript: The Good Parts",
      "author": "Douglas Crockford",
      "description": "...",
      "coverUrl": "https://...",
      "pageCount": 176,
      "isbn": "9780596517748"
    }
  ]
}
```

**Get Book Details**

```http
GET /v1/books/google/:googleBooksId
```

### User Books (Protected - Requires JWT)

**Get User's Books**

```http
GET /v1/user-books?status=reading
Authorization: Bearer <token>
```

**Add Book to Library**

```http
POST /v1/user-books
Authorization: Bearer <token>
Content-Type: application/json

{
  "googleBooksId": "abc123",
  "status": "reading",
  "rating": 4,
  "review": "Great book!"
}
```

**Update Book Status**

```http
PATCH /v1/user-books/:bookId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "rating": 5
}
```

**Remove Book**

```http
DELETE /v1/user-books/:userBookId
Authorization: Bearer <token>
```

### BookClub Books (Protected)

**Get BookClub Books**

```http
GET /v1/bookclub/:bookClubId/books?status=current
Authorization: Bearer <token>
```

**Add Book to BookClub**

```http
POST /v1/bookclub/:bookClubId/books
Authorization: Bearer <token>
Content-Type: application/json

{
  "googleBooksId": "abc123",
  "status": "current",
  "startDate": "2026-02-01",
  "endDate": "2026-03-01"
}
```

### Reading Progress (Protected)

**Update Reading Progress**

```http
POST /v1/bookclub-books/:bookClubBookId/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPage": 150,
  "totalPages": 300,
  "notes": "Great chapter!"
}
```

### Book Suggestions (Protected)

**Get Suggestions**

```http
GET /v1/bookclub/:bookClubId/suggestions
Authorization: Bearer <token>
```

**Create Suggestion**

```http
POST /v1/bookclub/:bookClubId/suggestions
Authorization: Bearer <token>
Content-Type: application/json

{
  "googleBooksId": "abc123",
  "reason": "This book fits our theme perfectly"
}
```

**Vote on Suggestion**

```http
POST /v1/bookclub/:bookClubId/suggestions/:suggestionId/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "vote": "up"
}
```

- `GET /v1/user-books` - Get user's books
- `POST /v1/user-books` - Add book to library
- `PATCH /v1/user-books/:bookId` - Update book status
- `DELETE /v1/user-books/:userBookId` - Remove book

### BookClub Books

- `GET /v1/bookclub/:bookClubId/books` - Get bookclub books (public)
- `POST /v1/bookclub/:bookClubId/books` - Add book (protected)
- `PATCH /v1/bookclub/:bookClubId/books/:bookId` - Update book (protected)
- `DELETE /v1/bookclub/:bookClubId/books/:bookId` - Remove book (protected)

### Reading Progress (Protected)

- `GET /v1/bookclub-books/:bookClubBookId/progress` - Get progress
- `POST /v1/bookclub-books/:bookClubBookId/progress` - Update progress
- `POST /v1/bookclub-books/:bookClubBookId/review` - Add/update review
- `GET /v1/bookclub-books/:bookClubBookId/reviews` - Get all reviews
- `DELETE /v1/bookclub-books/:bookClubBookId/review` - Delete review

### Book Suggestions (Protected)

- `GET /v1/bookclub/:bookClubId/suggestions` - Get suggestions
- `POST /v1/bookclub/:bookClubId/suggestions` - Create suggestion
- `POST /v1/bookclub/:bookClubId/suggestions/:suggestionId/vote` - Vote
- `POST /v1/bookclub/:bookClubId/suggestions/:suggestionId/accept` - Accept
- `DELETE /v1/bookclub/:bookClubId/suggestions/:suggestionId` - Delete

## Environment Variables

```bash
PORT=3002
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GOOGLE_BOOKS_API_KEY=your-api-key
NODE_ENV=development
```

## Getting Started

### Development

```bash
npm install
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Database

Uses Prisma ORM with PostgreSQL. Migrations managed via:

```bash
npx prisma migrate dev
npx prisma generate
```
