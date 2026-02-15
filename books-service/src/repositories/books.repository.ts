import prisma from '../config/database';

export class BooksRepository {
  /**
   * Find book by Google Books ID
   */
  static async findByGoogleBooksId(googleBooksId: string) {
    return await prisma.book.findUnique({
      where: { googleBooksId },
    });
  }

  /**
   * Create or update book
   */
  static async upsert(googleBooksId: string, bookData: any) {
    return await prisma.book.upsert({
      where: { googleBooksId },
      update: {
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        coverUrl: bookData.coverUrl,
        pageCount: bookData.pageCount,
        isbn: bookData.isbn,
        publishedDate: bookData.publishedDate,
      },
      create: bookData,
    });
  }

  /**
   * Find book by ID
   */
  static async findById(bookId: string) {
    return await prisma.book.findUnique({
      where: { id: bookId },
    });
  }
}
