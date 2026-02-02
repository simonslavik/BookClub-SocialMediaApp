# Books Service

Microservice for managing books, user libraries, bookclub books, reading progress, and book suggestions.

## Features

- ✅ **Book Search** - Search and get details from Google Books API
- ✅ **User Books** - Personal library management
- ✅ **BookClub Books** - Manage books for bookclubs
- ✅ **Reading Progress** - Track reading progress and reviews
- ✅ **Book Suggestions** - Suggest and vote on books for bookclubs

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

### Book Search (Public)

- `GET /v1/books/search?q=query` - Search books
- `GET /v1/books/google/:googleBooksId` - Get book details

### User Books (Protected)

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
