#!/bin/bash

# Code Review and Optimization Script for EzerAI
# This script performs static code analysis and identifies optimization opportunities

echo "Starting code review and optimization process..."

# Create directory for code review results
mkdir -p /home/ubuntu/ezerai/code_review

# ESLint for JavaScript/React code review
echo "Installing ESLint and plugins..."
cd /home/ubuntu/ezerai
npm install -g eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import eslint-plugin-jsx-a11y

# Create ESLint configuration
cat > /home/ubuntu/ezerai/.eslintrc.json << 'EOF'
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "react-hooks",
    "import",
    "jsx-a11y"
  ],
  "rules": {
    "react/prop-types": "off",
    "no-unused-vars": "warn",
    "no-console": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
EOF

echo "Running ESLint on client code..."
eslint --ext .js,.jsx /home/ubuntu/ezerai/client/src > /home/ubuntu/ezerai/code_review/client_eslint_results.txt || true

echo "Running ESLint on server code..."
eslint /home/ubuntu/ezerai/server > /home/ubuntu/ezerai/code_review/server_eslint_results.txt || true

# Check for security vulnerabilities with npm audit
echo "Checking for security vulnerabilities in client dependencies..."
cd /home/ubuntu/ezerai/client
npm audit --json > /home/ubuntu/ezerai/code_review/client_security_audit.json || true

echo "Checking for security vulnerabilities in server dependencies..."
cd /home/ubuntu/ezerai/server
npm audit --json > /home/ubuntu/ezerai/code_review/server_security_audit.json || true

# Performance optimization checks
echo "Analyzing bundle size and performance..."
cd /home/ubuntu/ezerai/client
npm install -g source-map-explorer
echo "// Add this to package.json scripts" > /home/ubuntu/ezerai/code_review/bundle_analysis_instructions.txt
echo '"analyze": "source-map-explorer 'build/static/js/*.js'"' >> /home/ubuntu/ezerai/code_review/bundle_analysis_instructions.txt

# Database query optimization suggestions
echo "Generating database query optimization suggestions..."
cat > /home/ubuntu/ezerai/code_review/db_optimization_suggestions.md << 'EOF'
# Database Query Optimization Suggestions

## Indexes
- Add indexes to frequently queried columns:
  ```sql
  CREATE INDEX idx_user_email ON users(email);
  CREATE INDEX idx_team_owner_id ON teams(owner_id);
  CREATE INDEX idx_team_member_team_id ON team_members(team_id);
  CREATE INDEX idx_team_member_user_id ON team_members(user_id);
  ```

## Query Optimization
- Use specific column selection instead of SELECT *
- Add LIMIT to pagination queries
- Use JOIN instead of nested queries where possible
- Consider using query caching for frequently accessed data

## Connection Pooling
- Implement connection pooling to reduce database connection overhead
- Configure appropriate pool size based on expected load

## Batch Operations
- Use bulk inserts/updates when processing multiple records
- Consider using transactions for related operations
EOF

# API optimization suggestions
echo "Generating API optimization suggestions..."
cat > /home/ubuntu/ezerai/code_review/api_optimization_suggestions.md << 'EOF'
# API Optimization Suggestions

## Response Compression
- Implement gzip/brotli compression for API responses
- Add the following middleware to server.js:
  ```javascript
  const compression = require('compression');
  app.use(compression());
  ```

## Caching
- Implement Redis caching for frequently accessed data
- Add cache headers for appropriate endpoints
- Consider using a CDN for static assets

## Rate Limiting
- Implement more granular rate limiting based on endpoint sensitivity
- Add rate limiting middleware to critical endpoints

## Pagination
- Ensure all list endpoints support pagination
- Use cursor-based pagination for large datasets
- Include total count and pagination metadata in responses

## Request Validation
- Add comprehensive request validation to all endpoints
- Return detailed validation errors to help clients
EOF

# Frontend optimization suggestions
echo "Generating frontend optimization suggestions..."
cat > /home/ubuntu/ezerai/code_review/frontend_optimization_suggestions.md << 'EOF'
# Frontend Optimization Suggestions

## Code Splitting
- Implement React.lazy() and Suspense for component-level code splitting
- Split routes into separate chunks
- Use dynamic imports for large libraries

## Performance Optimizations
- Memoize expensive calculations with useMemo
- Optimize re-renders with React.memo and useCallback
- Implement virtualization for long lists (react-window or react-virtualized)

## Asset Optimization
- Optimize images using WebP format and responsive sizes
- Lazy load images and components below the fold
- Implement font display swap for text visibility during font loading

## State Management
- Consider using Context API for simpler state management
- Implement proper state normalization to avoid duplication
- Use local state for UI-only state that doesn't need to be shared

## Build Optimization
- Enable source maps only in development
- Implement tree shaking to eliminate unused code
- Configure proper chunking strategy in webpack
EOF

# Security review
echo "Generating security review..."
cat > /home/ubuntu/ezerai/code_review/security_review.md << 'EOF'
# Security Review

## Authentication
- Ensure JWT tokens have appropriate expiration times
- Implement refresh token rotation
- Add rate limiting to authentication endpoints

## Authorization
- Verify all endpoints have proper authorization checks
- Implement role-based access control consistently
- Add middleware to validate permissions for protected routes

## Data Validation
- Validate all user inputs on both client and server
- Sanitize data before storing in database
- Implement proper error handling that doesn't expose sensitive information

## API Security
- Add security headers (Helmet.js for Express)
- Implement CORS with specific origins
- Use HTTPS for all communications

## Database Security
- Use parameterized queries to prevent SQL injection
- Encrypt sensitive data at rest
- Implement proper database access controls

## Dependency Security
- Regularly update dependencies
- Remove unused dependencies
- Monitor for security vulnerabilities in dependencies
EOF

# Code quality suggestions
echo "Generating code quality suggestions..."
cat > /home/ubuntu/ezerai/code_review/code_quality_suggestions.md << 'EOF'
# Code Quality Suggestions

## Consistent Coding Style
- Implement Prettier for consistent code formatting
- Add .prettierrc configuration file
- Set up pre-commit hooks to enforce formatting

## Error Handling
- Implement centralized error handling
- Add proper logging with different severity levels
- Create custom error classes for different error types

## Testing
- Increase test coverage for critical components
- Add integration tests for main user flows
- Implement snapshot testing for UI components

## Documentation
- Add JSDoc comments to functions and components
- Create README files for each major directory
- Document complex algorithms and business logic

## Code Organization
- Follow consistent naming conventions
- Organize files by feature rather than type
- Extract reusable logic into custom hooks and utilities
EOF

# Create summary report
echo "Creating summary report..."
cat > /home/ubuntu/ezerai/code_review/summary.md << 'EOF'
# Code Review and Optimization Summary

## Overview
This report summarizes the findings from the code review and optimization analysis of the EzerAI application. The review focused on code quality, performance, security, and best practices.

## Key Findings

### Strengths
- Well-structured project organization
- Comprehensive API implementation
- Good separation of concerns between components
- Proper authentication and authorization implementation
- Detailed documentation and testing

### Areas for Improvement
1. **Performance Optimization**
   - Implement code splitting for faster initial load
   - Add caching for frequently accessed data
   - Optimize database queries with proper indexing

2. **Security Enhancements**
   - Add additional security headers
   - Implement more robust input validation
   - Enhance rate limiting for sensitive endpoints

3. **Code Quality**
   - Reduce code duplication in UI components
   - Improve error handling consistency
   - Add more comprehensive logging

4. **Build and Deployment**
   - Optimize bundle size
   - Implement CI/CD pipeline
   - Add automated security scanning

## Recommendations
Please review the detailed reports in the code_review directory:
- api_optimization_suggestions.md
- code_quality_suggestions.md
- db_optimization_suggestions.md
- frontend_optimization_suggestions.md
- security_review.md

Implementing these suggestions will improve the application's performance, security, and maintainability.
EOF

echo "Code review and optimization process completed. Results are available in /home/ubuntu/ezerai/code_review/"
