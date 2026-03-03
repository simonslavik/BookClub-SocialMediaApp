# Books Service Testing Guide

## Setup

1. Install test dependencies:
```bash
npm install
```

2. Set up test database:
```bash
# Create a separate test database
docker run -d \
  --name books-test-db \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=books_test \
  -p 5433:5432 \
  postgres:15

# Run migrations on test database
DATABASE_URL="postgresql://test:test@localhost:5433/books_test" npx prisma migrate deploy
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm run test:coverage
```

## Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── teardown.ts                 # Global test cleanup
├── unit/                       # Unit tests
│   ├── validation.test.ts      # Validation schema tests
│   └── controllers/
│       └── userBooksController.test.ts
└── integration/                # Integration tests
    ├── userBooks.integration.test.ts
    └── bookSearch.integration.test.ts
```

## Test Coverage

The test suite covers:

### Unit Tests
- ✅ Validation schemas (add/update books, bookclub books)
- ✅ User books controller (CRUD operations)
- ✅ Error handling
- ✅ Authentication middleware

### Integration Tests
- ✅ Complete API endpoints
- ✅ Database operations
- ✅ JWT authentication flow
- ✅ Request/response validation
- ✅ Error scenarios

## Writing New Tests

### Unit Test Example
```typescript
import { yourFunction } from '../src/yourModule';

describe('YourModule', () => {
  it('should do something', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Integration Test Example
```typescript
import request from 'supertest';
import app from '../src/app';

describe('API Endpoint', () => {
  it('should return data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Mocking

### Mock Prisma
```typescript
jest.mock('../src/config/database', () => ({
  userBook: {
    findMany: jest.fn(),
    create: jest.fn()
  }
}));
```

### Mock External Services
```typescript
jest.mock('../utils/googlebookapi', () => ({
  GoogleBooksService: {
    searchBooks: jest.fn(),
    getBookById: jest.fn()
  }
}));
```

## Continuous Integration

Add to your CI pipeline:
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: books_test
        ports:
          - 5433:5432
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run prisma:generate
      - run: npm test
```

## Troubleshooting

### Database Connection Errors
- Ensure test database is running on port 5433
- Check `.env.test` has correct DATABASE_URL
- Run `npx prisma generate` before tests

### JWT Errors
- Verify JWT_SECRET is set in `.env.test`
- Check token expiration in test setup

### Timeout Errors
- Increase timeout in `jest.config.js` (default: 10000ms)
- Check database connection speed

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterEach`/`afterAll`
3. **Mocking**: Mock external services (Google Books API)
4. **Coverage**: Aim for >80% code coverage
5. **Naming**: Use descriptive test names (should/when/given)
6. **Assertions**: Be specific with expectations
