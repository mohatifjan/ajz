# AJZ POS System - Installation & Running Guide

## Quick Start

### 1. Install MongoDB
- Download from: https://www.mongodb.com/try/download/community
- Install and start MongoDB service
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB connection string
# Default: mongodb://localhost:27017/ajz_pos

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:5000**

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start frontend application
npm run dev
```

Frontend will run on: **http://localhost:3000**

### 4. Access the Application

1. Open browser and go to: **http://localhost:3000**
2. Login with demo credentials:
   - Email: `admin@ajz.com`
   - Password: `demo123456`

## Demo Credentials

For testing different roles:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@ajz.com | demo123456 | Full system access |
| Manager | manager@ajz.com | demo123456 | Dashboard, reports |
| Staff | staff@ajz.com | demo123456 | Basic operations |

## Key Features to Explore

### Dashboard
- Real-time sales metrics
- Revenue tracking
- Customer intelligence
- Inventory status

### Products
- Add/edit/delete products
- Track inventory levels
- Monitor low stock items

### Customers
- Manage B2B customers
- Track credit limits
- Monitor outstanding payments
- View customer history

### Orders
- Create new orders
- Track order status
- Record payments
- View order details

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB service is running
- Check MONGODB_URI in .env file
- Verify database permissions

### CORS Error
- Check CORS_ORIGIN in backend .env
- Default: http://localhost:3000

### Port Already in Use
- Backend (5000): `lsof -i :5000` then `kill -9 <PID>`
- Frontend (3000): `lsof -i :3000` then `kill -9 <PID>`

### Dependencies Issues
- Delete node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

## Production Deployment

### Environment Variables for Production
Update .env files with production values:
- Use strong JWT_SECRET
- Update CORS_ORIGIN to your domain
- Use production MongoDB URI

### Build for Production
```bash
# Backend: Already production-ready
# Frontend:
cd frontend
npm run build
```

## API Health Check

Test if backend is running:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "success",
  "message": "AJZ POS Server is running"
}
```

## Database Seeding (Optional)

To add sample data, create a seed script in backend:
```bash
# Run after backend setup
node scripts/seed.js
```

## Performance Tips

1. Enable database indexing automatically
2. Clear browser cache if issues occur
3. Use Chrome DevTools for debugging
4. Monitor MongoDB performance

## Support & Documentation

- Full API documentation: See README.md
- Each endpoint is documented with required fields
- Error responses follow standard format

---

**Happy Using! 🚀**
