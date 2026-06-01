# AJZ POS - Development Guidelines

## Code Structure

### Backend Code Organization
- **models/**: Define MongoDB schemas with validation
- **controllers/**: Handle business logic and request processing
- **routes/**: Define API endpoints and middleware
- **middleware/**: Authentication, error handling, validation
- **utils/**: Helper functions and utilities
- **validators/**: Input validation schemas

### Frontend Code Organization
- **components/**: Reusable UI components
- **pages/**: Page components (views)
- **services/**: API communication
- **store/**: State management with Zustand
- **hooks/**: Custom React hooks
- **utils/**: Helper functions
- **styles/**: Global and component styles

## Coding Standards

### JavaScript/Node.js
- Use ES6+ syntax
- Use async/await for asynchronous operations
- Implement proper error handling with try/catch
- Use meaningful variable names
- Add JSDoc comments for functions

### React
- Use functional components with hooks
- Implement proper key props in lists
- Optimize re-renders with React.memo where necessary
- Use proper prop validation
- Follow component naming conventions (PascalCase)

### Database Queries
- Use indexes for frequently queried fields
- Implement pagination for list endpoints
- Use aggregation pipelines for complex queries
- Add proper error handling for database operations

## Git Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit with descriptive messages
3. Push changes: `git push origin feature/feature-name`
4. Create pull request for review

## Testing

### Backend
```bash
npm test
```

### Frontend
```bash
npm test
```

## Security Best Practices

1. **Authentication**
   - Use JWT with secure secrets
   - Implement token refresh mechanism
   - Add rate limiting for login attempts

2. **Data Protection**
   - Hash passwords with bcrypt
   - Validate all input data
   - Sanitize user inputs

3. **API Security**
   - Implement CORS properly
   - Use HTTPS in production
   - Add request validation
   - Implement rate limiting

4. **Database Security**
   - Use indexed queries efficiently
   - Implement proper user permissions
   - Regular backups

## Performance Optimization

### Backend
- Use database indexing
- Implement caching strategies
- Optimize query performance
- Use pagination for large datasets
- Compress responses

### Frontend
- Code splitting for lazy loading
- Image optimization
- Memoization of components
- Efficient state management
- Minimize bundle size

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connected and tested
- [ ] CORS configured properly
- [ ] Error logging implemented
- [ ] Security headers added
- [ ] Rate limiting enabled
- [ ] Database backups scheduled
- [ ] API documentation updated
- [ ] Tests passing
- [ ] Performance tested

## Troubleshooting Common Issues

### Port Already in Use
```bash
# Kill process on port
sudo lsof -i :5000
sudo kill -9 <PID>
```

### MongoDB Connection Issues
- Check MongoDB service status
- Verify connection string
- Check firewall settings

### CORS Errors
- Verify CORS_ORIGIN in .env
- Check request headers
- Verify API endpoint configuration

### Missing Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## Documentation

- Keep README.md updated
- Document API changes
- Add inline comments for complex logic
- Update SETUP.md with new requirements

---

**Last Updated**: April 22, 2026
