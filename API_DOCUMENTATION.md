# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Request body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "staff"
}
```

Response:
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "staff"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 2. Login
**POST** `/auth/login`

Request body:
```json
{
  "email": "admin@ajz.com",
  "password": "demo123456"
}
```

Response:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@ajz.com",
      "role": "admin",
      "department": "admin"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 3. Refresh Token
**POST** `/auth/refresh-token`

Request body:
```json
{
  "refreshToken": "refresh_token_value"
}
```

---

## Product Endpoints

### 1. Get All Products
**GET** `/products?page=1&limit=20&search=&status=active&category=`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name, SKU, or description
- `status`: Filter by status (active, inactive, discontinued)
- `category`: Filter by category ID

Response:
```json
{
  "status": "success",
  "data": [
    {
      "_id": "product_id",
      "sku": "PLT-001",
      "name": "Plastic Bucket 20L",
      "category": "category_id",
      "costPrice": 50,
      "sellingPrice": 75,
      "wholesalePrice": 70,
      "stocks": {
        "totalStock": 100,
        "reorderLevel": 20
      },
      "status": "active"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "total": 50,
    "pages": 3,
    "limit": 20
  }
}
```

### 2. Create Product
**POST** `/products` (Requires: Admin/Manager)

Request body:
```json
{
  "sku": "PLT-002",
  "name": "Plastic Bucket 25L",
  "category": "category_id",
  "description": "Durable plastic bucket",
  "costPrice": 60,
  "sellingPrice": 85,
  "wholesalePrice": 80,
  "unit": "pcs",
  "stocks": {
    "totalStock": 50,
    "reorderLevel": 15,
    "reorderQuantity": 100
  },
  "tax": 5,
  "discount": 0
}
```

### 3. Update Product
**PUT** `/products/:id` (Requires: Admin/Manager)

### 4. Update Stock
**PATCH** `/products/:id/stock` (Requires: Authenticated)

Request body:
```json
{
  "quantity": 10,
  "movementType": "inbound",
  "reference": "PO-001",
  "remarks": "Purchased from supplier"
}
```

Movement types: `purchase`, `sales`, `return`, `adjustment`, `damage`

---

## Customer Endpoints

### 1. Get All Customers
**GET** `/customers?page=1&limit=20&search=&status=active&customerType=b2b`

Response:
```json
{
  "status": "success",
  "data": [
    {
      "_id": "customer_id",
      "companyName": "ABC Traders",
      "contactPerson": {
        "firstName": "Raj",
        "lastName": "Kumar"
      },
      "email": "raj@abctraders.com",
      "phone": "+919876543210",
      "totalPurchases": 50000,
      "totalOutstanding": 5000,
      "creditLimit": 10000,
      "paymentTerms": 30,
      "status": "active",
      "accountStatus": "good_standing"
    }
  ],
  "pagination": { ... }
}
```

### 2. Create Customer
**POST** `/customers`

Request body:
```json
{
  "companyName": "XYZ Retailers",
  "contactPerson": {
    "firstName": "Priya",
    "lastName": "Singh",
    "designation": "Manager"
  },
  "email": "priya@xyz.com",
  "phone": "+919876543210",
  "address": {
    "street": "123 Market St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "gstNumber": "27AABCU1234H1Z0",
  "creditLimit": 20000,
  "paymentTerms": 45,
  "discount": 5
}
```

### 3. Get Top Customers
**GET** `/customers/analytics/top-customers?days=30`

### 4. Get Overdue Payments
**GET** `/customers/analytics/overdue-payments?days=30`

---

## Order Endpoints

### 1. Get All Orders
**GET** `/orders?page=1&limit=20&status=confirmed&search=`

Response:
```json
{
  "status": "success",
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-20240422-0001",
      "customer": { ... },
      "items": [
        {
          "product": { ... },
          "quantity": 5,
          "unitPrice": 75,
          "lineTotal": 375,
          "lineProfit": 125
        }
      ],
      "summary": {
        "subtotal": 375,
        "discount": 0,
        "tax": 37.5,
        "shipping": 0,
        "totalAmount": 412.5,
        "grossProfit": 125
      },
      "paymentMethod": "credit",
      "paymentStatus": "partial",
      "status": "confirmed",
      "createdAt": "2024-04-22T10:30:00Z"
    }
  ]
}
```

### 2. Create Order
**POST** `/orders`

Request body:
```json
{
  "customer": "customer_id",
  "items": [
    {
      "product": "product_id",
      "quantity": 5,
      "unitPrice": 75,
      "discount": 0,
      "tax": 0
    }
  ],
  "paymentMethod": "credit",
  "discount": 0,
  "tax": 0,
  "shippingCost": 0,
  "notes": "Special order for VIP customer"
}
```

### 3. Record Payment
**POST** `/orders/:id/payment`

Request body:
```json
{
  "amount": 200,
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TXN-12345"
}
```

### 4. Update Order Status
**PATCH** `/orders/:id/status`

Request body:
```json
{
  "status": "delivered",
  "deliveryStatus": "delivered"
}
```

---

## Dashboard Endpoints

All dashboard endpoints require Admin/Manager role.

### 1. Dashboard Summary
**GET** `/dashboard/summary`

Response:
```json
{
  "status": "success",
  "data": {
    "todaySales": {
      "totalSales": 5000,
      "orders": 10,
      "profit": 1000
    },
    "activeCustomers": 45,
    "activeProducts": 120,
    "totalOutstanding": 25000,
    "metrics": { ... }
  }
}
```

### 2. Sales Overview
**GET** `/dashboard/sales-overview?period=monthly`

Period options: `daily`, `weekly`, `monthly`

### 3. Revenue Metrics
**GET** `/dashboard/revenue`

Response:
```json
{
  "status": "success",
  "data": {
    "totalRevenue": {
      "totalRevenue": 500000,
      "totalCost": 300000,
      "totalProfit": 200000,
      "totalOrders": 150
    },
    "revenueLastMonth": { ... },
    "outstandingReceivables": { ... },
    "paymentMethodBreakdown": [ ... ]
  }
}
```

### 4. Customer Intelligence
**GET** `/dashboard/customers`

Returns:
- Top customers by revenue
- Overdue accounts
- Active customers count
- High outstanding balances

### 5. Inventory Overview
**GET** `/dashboard/inventory`

Returns:
- Total products and categories
- Low stock items
- Stock valuation
- Fast-moving items

### 6. Sales Analytics
**GET** `/dashboard/analytics`

Returns:
- Product performance
- Daily sales trends

---

## Inventory Endpoints

### 1. Get Inventory Movements
**GET** `/inventory/movements?page=1&limit=20&movementType=&status=&product=`

### 2. Get Product Inventory History
**GET** `/inventory/product/:productId`

### 3. Approve Movement
**PATCH** `/inventory/movements/:id/approve` (Requires: Admin/Manager)

Request body:
```json
{
  "status": "approved"
}
```

### 4. Inventory Summary
**GET** `/inventory/summary`

---

## User Endpoints (Admin Only)

### 1. Get All Users
**GET** `/users?page=1&limit=20&role=&status=active`

### 2. Update User
**PUT** `/users/:id`

Request body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "department": "sales",
  "role": "manager",
  "status": "active"
}
```

### 3. Change Password
**PUT** `/users/change-password`

Request body:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "status": "validation_error",
  "message": "Validation failed",
  "errors": [
    { "param": "email", "msg": "Invalid email" }
  ]
}
```

### Authentication Error (401)
```json
{
  "status": "auth_error",
  "message": "Invalid token"
}
```

### Forbidden (403)
```json
{
  "status": "error",
  "message": "Access denied. Required roles: admin"
}
```

### Not Found (404)
```json
{
  "status": "error",
  "message": "Product not found"
}
```

### Duplicate Error (400)
```json
{
  "status": "duplicate_error",
  "message": "Email already exists",
  "field": "email"
}
```

### Server Error (500)
```json
{
  "status": "error",
  "message": "Internal Server Error"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate record |
| 500 | Server Error - Internal error |

---

## Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- 100 requests per minute per IP
- 1000 requests per hour per user

---

**Last Updated**: April 22, 2026
