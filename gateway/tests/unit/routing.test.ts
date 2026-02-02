describe('Gateway Routing Tests', () => {
  describe('Route Pattern Matching', () => {
    const matchRoute = (path: string, pattern: string): boolean => {
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\//g, '\\/')
        .replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    };

    it('should match exact paths', () => {
      expect(matchRoute('/api/auth/login', '/api/auth/login')).toBe(true);
      expect(matchRoute('/api/auth/register', '/api/auth/login')).toBe(false);
    });

    it('should match wildcard patterns', () => {
      expect(matchRoute('/api/users/123', '/api/users/*')).toBe(true);
      expect(matchRoute('/api/users/123/profile', '/api/users/*')).toBe(true);
      expect(matchRoute('/api/books/search', '/api/users/*')).toBe(false);
    });

    it('should match route parameters', () => {
      expect(matchRoute('/api/users/123', '/api/users/:id')).toBe(true);
      expect(matchRoute('/api/bookclubs/abc-123', '/api/bookclubs/:id')).toBe(true);
      expect(matchRoute('/api/users/123/friends', '/api/users/:id')).toBe(false);
    });

    it('should match nested route parameters', () => {
      expect(matchRoute('/api/bookclubs/123/rooms/456', '/api/bookclubs/:id/rooms/:roomId')).toBe(true);
      expect(matchRoute('/api/books/123/progress', '/api/books/:id/progress')).toBe(true);
    });
  });

  describe('Service Target Resolution', () => {
    interface RouteConfig {
      pattern: string;
      target: string;
      auth?: boolean;
    }

    const routes: RouteConfig[] = [
      { pattern: '/api/auth/*', target: 'USER_SERVICE', auth: false },
      { pattern: '/api/users/*', target: 'USER_SERVICE', auth: true },
      { pattern: '/api/books/*', target: 'BOOKS_SERVICE', auth: true },
      { pattern: '/api/bookclubs/*', target: 'COLLAB_SERVICE', auth: true },
      { pattern: '/api/rooms/*', target: 'COLLAB_SERVICE', auth: true }
    ];

    const resolveTarget = (path: string): RouteConfig | undefined => {
      return routes.find(route => {
        const pattern = route.pattern
          .replace(/\*/g, '.*')
          .replace(/\//g, '\\/')
          .replace(/:\w+/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      });
    };

    it('should route auth paths to USER_SERVICE', () => {
      expect(resolveTarget('/api/auth/login')?.target).toBe('USER_SERVICE');
      expect(resolveTarget('/api/auth/register')?.target).toBe('USER_SERVICE');
      expect(resolveTarget('/api/auth/validate')?.target).toBe('USER_SERVICE');
    });

    it('should route user paths to USER_SERVICE', () => {
      expect(resolveTarget('/api/users/123')?.target).toBe('USER_SERVICE');
      expect(resolveTarget('/api/users/profile')?.target).toBe('USER_SERVICE');
    });

    it('should route book paths to BOOKS_SERVICE', () => {
      expect(resolveTarget('/api/books/search')?.target).toBe('BOOKS_SERVICE');
      expect(resolveTarget('/api/books/123')?.target).toBe('BOOKS_SERVICE');
    });

    it('should route bookclub paths to COLLAB_SERVICE', () => {
      expect(resolveTarget('/api/bookclubs/123')?.target).toBe('COLLAB_SERVICE');
      expect(resolveTarget('/api/rooms/456')?.target).toBe('COLLAB_SERVICE');
    });

    it('should require auth for protected routes', () => {
      expect(resolveTarget('/api/users/profile')?.auth).toBe(true);
      expect(resolveTarget('/api/books/search')?.auth).toBe(true);
      expect(resolveTarget('/api/bookclubs/123')?.auth).toBe(true);
    });

    it('should not require auth for public routes', () => {
      expect(resolveTarget('/api/auth/login')?.auth).toBe(false);
      expect(resolveTarget('/api/auth/register')?.auth).toBe(false);
    });
  });

  describe('URL Path Transformation', () => {
    const transformPath = (incomingPath: string, routePattern: string): string => {
      // Remove the gateway prefix and keep the service-specific path
      const prefix = routePattern.replace('*', '');
      if (incomingPath.startsWith(prefix)) {
        return '/api' + incomingPath.substring(prefix.length - 1);
      }
      return incomingPath;
    };

    it('should preserve path when forwarding', () => {
      expect(transformPath('/api/users/profile', '/api/users/*')).toBe('/api/users/profile');
      expect(transformPath('/api/books/search', '/api/books/*')).toBe('/api/books/search');
    });

    it('should handle nested paths', () => {
      expect(transformPath('/api/bookclubs/123/rooms', '/api/bookclubs/*')).toBe('/api/bookclubs/123/rooms');
    });
  });
});

describe('Service Configuration Tests', () => {
  describe('Service URL Resolution', () => {
    const serviceUrls = {
      USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:3001/api',
      BOOKS_SERVICE: process.env.BOOKS_SERVICE_URL || 'http://localhost:3002/api',
      COLLAB_SERVICE: process.env.COLLAB_SERVICE_URL || 'http://localhost:3003/api'
    };

    it('should have all service URLs defined', () => {
      expect(serviceUrls.USER_SERVICE).toBeDefined();
      expect(serviceUrls.BOOKS_SERVICE).toBeDefined();
      expect(serviceUrls.COLLAB_SERVICE).toBeDefined();
    });

    it('should have valid HTTP URLs', () => {
      Object.values(serviceUrls).forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });

    it('should construct proper target URLs', () => {
      const buildTargetUrl = (service: string, path: string): string => {
        const baseUrl = serviceUrls[service as keyof typeof serviceUrls];
        return `${baseUrl}${path}`;
      };

      expect(buildTargetUrl('USER_SERVICE', '/users/profile'))
        .toBe('http://localhost:3001/api/users/profile');
      expect(buildTargetUrl('BOOKS_SERVICE', '/books/search'))
        .toBe('http://localhost:3002/api/books/search');
    });
  });
});
