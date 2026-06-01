# AJZ POS & Inventory Management System

A professional enterprise-grade Point of Sale (POS) and Inventory Management software built with the MERN stack (MongoDB, Express.js, React.js, Node.js). Designed specifically for wholesale plastic goods companies with comprehensive dashboard analytics, customer intelligence, and inventory tracking.

## 📋 Features

### Core Functionality
- **User Management**: Role-based access control (Admin, Manager, Staff)
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Product Management**: SKU tracking, pricing management (cost, retail, wholesale), and categorization
- **Customer Management**: B2B customer profiling, credit limit tracking, payment term management
- **Order Management**: Complete order lifecycle from creation to delivery
- **Payment Tracking**: Multiple payment methods (cash, credit card, check, bank transfer, credit)
- **Inventory Tracking**: Real-time stock monitoring with low-stock alerts

### Executive Dashboard
- **Real-time Metrics**: Today's sales, active customers, product count, outstanding receivables
- **Sales Analytics**: Daily/weekly/monthly trends, profit calculations, payment method breakdown
- **Customer Intelligence**: Top customers by revenue, overdue payments (30/60/90 days), credit utilization
- **Inventory Overview**: Total stock valuation, low-stock items, fast/slow-moving products
- **Profit Metrics**: Gross profit calculation, profit margin analysis, revenue vs receivables

### Advanced Features
- Aggregation pipelines for complex analytics
- Database indexing for optimal query performance
- Role-based endpoint authorization
- Comprehensive error handling and validation
- Responsive UI with Tailwind CSS and Recharts visualization

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express-validator** - Input validation

### Frontend
- **React 18** - UI library
- **React Router** - Routing
- **Zustand** - State management
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📦 Project Structure

```
NEW/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Customer.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── Category.js
│   │   └── InventoryMovement.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── customerController.js
│   │   ├── orderController.js
│   │   ├── dashboardController.js
│   │   ├── userController.js
│   │   └── inventoryController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── userRoutes.js
│   │   └── inventoryRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── validators/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── DashboardMetrics.jsx
    │   │   ├── SalesChart.jsx
    │   │   ├── CustomerIntelligence.jsx
    │   │   └── InventoryStatus.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ProductsPage.jsx
    │   │   ├── CustomersPage.jsx
    │   │   └── OrdersPage.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── store/
    │   │   ├── authStore.js
    │   │   └── uiStore.js
    │   ├── utils/
    │   ├── styles/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.cjs
    ├── postcss.config.cjs
    ├── package.json
    └── .env.example
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create .env file** (copy from .env.example):
   ```bash
   cp .env.example .env
   ```

4. **Configure MongoDB**:
   Edit `.env` and set:
   ```
   MONGODB_URI=mongodb://localhost:27017/ajz_pos
   ```

5. **Set JWT secret** (change in production):
   ```
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   ```

6. **Start the backend server**:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create .env file**:
   ```bash
   cp .env.example .env
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

## 🔐 Authentication

### Default Demo Credentials
- **Email**: admin@ajz.com
- **Password**: demo123456
- **Role**: Admin

### User Roles & Permissions
- **Admin**: Full system access, user management, system configuration
- **Manager**: Dashboard access, order management, customer management, report generation
- **Staff**: Limited access (sales, basic inventory checks)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `PATCH /api/products/:id/stock` - Update stock
- `GET /api/products/low-stock` - Get low stock items
- `DELETE /api/products/:id` - Delete product

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/analytics/top-customers` - Top customers
- `GET /api/customers/analytics/overdue-payments` - Overdue payments
- `DELETE /api/customers/:id` - Delete customer

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/payment` - Record payment
- `DELETE /api/orders/:id` - Delete order

### Dashboard
- `GET /api/dashboard/summary` - Dashboard summary
- `GET /api/dashboard/sales-overview` - Sales overview
- `GET /api/dashboard/revenue` - Revenue metrics
- `GET /api/dashboard/customers` - Customer intelligence
- `GET /api/dashboard/inventory` - Inventory overview
- `GET /api/dashboard/analytics` - Sales analytics

### Inventory
- `GET /api/inventory/movements` - Inventory movements
- `GET /api/inventory/product/:productId` - Product inventory history
- `PATCH /api/inventory/movements/:id/approve` - Approve movement
- `GET /api/inventory/summary` - Inventory summary

### Users (Admin Only)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `PUT /api/users/change-password` - Change password
- `PATCH /api/users/:id/deactivate` - Deactivate user
- `DELETE /api/users/:id` - Delete user

## 📊 Database Schema

### User Schema
- firstName, lastName, email, phone
- password (hashed), role, department
- status, permissions, lastLogin
- Account lock mechanism for security

### Product Schema
- sku (unique), name, description, category
- costPrice, sellingPrice, wholesalePrice, retailPrice
- Inventory tracking (totalStock, reorderLevel, reorderQuantity)
- Supplier information, tax, discount, tags

### Customer Schema
- Company information, contact person details
- B2B specific: GST/PAN numbers, credit limit, payment terms
- Outstanding balance tracking
- Account status: good_standing, at_risk, overdue, delinquent

### Order Schema
- orderNumber (unique), customer reference
- Line items with product, quantity, pricing
- Summary: subtotal, discount, tax, shipping, total
- Payment status tracking
- Delivery tracking

### Payment Schema
- Payment tracking per order
- Multiple payment methods support
- Refund management
- Payment approval workflow

### InventoryMovement Schema
- Movement type: purchase, sales, return, adjustment, damage
- Quantity tracking with before/after states
- Approval workflow for stock adjustments

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ajz_pos
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:5000/api
```

## 📈 Performance Optimizations

- **Database Indexing**: Optimized indexes on frequently queried fields
- **Aggregation Pipelines**: Complex analytics queries with MongoDB aggregation
- **Lazy Loading**: React component code splitting
- **Caching**: JWT token caching on client
- **Pagination**: Implemented on all list endpoints

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment (Heroku)
```bash
# Install Heroku CLI
heroku login
heroku create ajz-pos-backend
git push heroku main
```

### Frontend Deployment (Vercel)
```bash
npm run build
vercel deploy
```

## 📝 API Documentation

Full API documentation with request/response examples is available at:
- Swagger/OpenAPI docs can be added at `/api/docs`

## 🤝 Contributing

1. Create a feature branch
2. Commit changes
3. Push to branch
4. Create pull request

## 📄 License

MIT License - See LICENSE file for details

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: info@ajzwholesale.com
- Phone: +1-800-XXX-XXXX

## 🔄 Updates & Maintenance

The system is built for scalability and includes:
- Modular architecture for easy feature addition
- Clean separation of concerns
- Comprehensive error handling
- Logging capabilities
- Database backup recommendations

---

**Version**: 1.0.0  
**Last Updated**: April 22, 2026  
**Company**: AJZ Wholesale Plastics
