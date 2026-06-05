import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Customer from './models/Customer.js';
import Supplier from './models/Supplier.js';
import Branch from './models/Branch.js';
import Order from './models/Order.js';
import Invoice from './models/Invoice.js';
import InventoryMovement from './models/InventoryMovement.js';
import PurchaseOrder from './models/PurchaseOrder.js';
import PurchasePayment from './models/PurchasePayment.js';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ajz_pos', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      Branch.deleteMany({}),
      Order.deleteMany({}),
      Invoice.deleteMany({}),
      InventoryMovement.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      PurchasePayment.deleteMany({})
    ]);

    console.log('Seeding dummy data...');

    // 1. Create Users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('demo123456', 10);

    const users = await User.insertMany([
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@ajz.com',
        phone: '+1234567890',
        password: hashedPassword,
        role: 'admin',
        department: 'admin',
        status: 'active'
      },
      {
        firstName: 'John',
        lastName: 'Manager',
        email: 'manager@ajz.com',
        phone: '+1234567891',
        password: hashedPassword,
        role: 'manager',
        department: 'sales',
        status: 'active'
      },
      {
        firstName: 'Sarah',
        lastName: 'Staff',
        email: 'staff@ajz.com',
        phone: '+1234567892',
        password: hashedPassword,
        role: 'staff',
        department: 'inventory',
        status: 'active'
      }
    ]);

    // 2. Create Branches
    console.log('Creating branches...');
    const branches = await Branch.insertMany([
      {
        name: 'Main Branch',
        code: 'MAIN',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        },
        manager: users[1]._id,
        status: 'active'
      },
      {
        name: 'Downtown Branch',
        code: 'DOWN',
        address: {
          street: '456 Downtown Ave',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400002',
          country: 'India'
        },
        manager: users[1]._id,
        status: 'active'
      }
    ]);

    // 3. Create Categories
    console.log('Creating categories...');
    const categories = await Category.insertMany([
      { name: 'Plastic Containers', description: 'Buckets, containers, and storage items', status: 'active' },
      { name: 'Plastic Bags', description: 'Shopping bags and packaging', status: 'active' },
      { name: 'Plastic Pipes', description: 'Pipes and fittings', status: 'active' },
      { name: 'Plastic Sheets', description: 'Sheets and panels', status: 'active' },
      { name: 'Plastic Furniture', description: 'Chairs, tables, and furniture items', status: 'active' }
    ]);

    // 4. Create Products
    console.log('Creating products...');
    const products = await Product.insertMany([
      {
        sku: 'PLT-BKT-20L',
        name: 'Plastic Bucket 20L',
        category: categories[0]._id,
        description: 'Durable 20L plastic bucket with handle',
        costPrice: 150,
        sellingPrice: 225,
        wholesalePrice: 200,
        unit: 'pcs',
        stocks: {
          totalStock: 500,
          reorderLevel: 100,
          reorderQuantity: 200
        },
        tax: 18,
        discount: 0,
        branch: branches[0]._id,
        status: 'active'
      },
      {
        sku: 'PLT-BKT-25L',
        name: 'Plastic Bucket 25L',
        category: categories[0]._id,
        description: 'Large 25L plastic bucket',
        costPrice: 180,
        sellingPrice: 270,
        wholesalePrice: 240,
        unit: 'pcs',
        stocks: {
          totalStock: 300,
          reorderLevel: 80,
          reorderQuantity: 150
        },
        tax: 18,
        discount: 0,
        branch: branches[0]._id,
        status: 'active'
      },
      {
        sku: 'PLT-BAG-SHP',
        name: 'Shopping Bag Large',
        category: categories[1]._id,
        description: 'Large shopping bag with handles',
        costPrice: 25,
        sellingPrice: 40,
        wholesalePrice: 35,
        unit: 'pcs',
        stocks: {
          totalStock: 1000,
          reorderLevel: 200,
          reorderQuantity: 500
        },
        tax: 18,
        discount: 0,
        branch: branches[0]._id,
        status: 'active'
      },
      {
        sku: 'PLT-PIP-2IN',
        name: 'PVC Pipe 2 Inch',
        category: categories[2]._id,
        description: '2 inch diameter PVC pipe, 6ft length',
        costPrice: 120,
        sellingPrice: 180,
        wholesalePrice: 160,
        unit: 'pcs',
        stocks: {
          totalStock: 200,
          reorderLevel: 50,
          reorderQuantity: 100
        },
        tax: 18,
        discount: 0,
        branch: branches[1]._id,
        status: 'active'
      },
      {
        sku: 'PLT-SHT-4X8',
        name: 'Plastic Sheet 4x8 ft',
        category: categories[3]._id,
        description: '4x8 ft plastic sheet, 5mm thick',
        costPrice: 450,
        sellingPrice: 675,
        wholesalePrice: 600,
        unit: 'pcs',
        stocks: {
          totalStock: 50,
          reorderLevel: 15,
          reorderQuantity: 30
        },
        tax: 18,
        discount: 0,
        branch: branches[1]._id,
        status: 'active'
      }
    ]);

    // 5. Create Suppliers
    console.log('Creating suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        companyName: 'ABC Plastics Ltd',
        contactPerson: {
          firstName: 'Rajesh',
          lastName: 'Kumar'
        },
        email: 'rajesh@abcplastics.com',
        phone: '+919876543210',
        address: {
          street: '789 Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400003',
          country: 'India'
        },
        creditLimit: 500000,
        paymentTerms: '30_days',
        creditUsed: 150000,
        totalOutstanding: 150000,
        accountStatus: 'good_standing',
        branch: branches[0]._id,
        status: 'active'
      },
      {
        companyName: 'XYZ Polymers Pvt Ltd',
        contactPerson: {
          firstName: 'Priya',
          lastName: 'Singh'
        },
        email: 'priya@xyzpolymers.com',
        phone: '+919876543211',
        address: {
          street: '321 Business Park',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400004',
          country: 'India'
        },
        creditLimit: 300000,
        paymentTerms: '45_days',
        creditUsed: 75000,
        totalOutstanding: 75000,
        accountStatus: 'good_standing',
        branch: branches[1]._id,
        status: 'active'
      }
    ]);

    // 6. Create Customers
    console.log('Creating customers...');
    const customers = await Customer.insertMany([
      {
        companyName: 'Metro Retail Chain',
        contactPerson: {
          firstName: 'Amit',
          lastName: 'Sharma',
          designation: 'Purchase Manager'
        },
        email: 'amit@metroretail.com',
        phone: '+919876543212',
        address: {
          street: '123 Shopping Mall',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400005',
          country: 'India'
        },
        gstNumber: '27AABCU1234H1Z0',
        creditLimit: 200000,
        paymentTerms: 30,
        discount: 5,
        totalPurchases: 150000,
        totalOutstanding: 25000,
        accountStatus: 'good_standing',
        customerType: 'b2b',
        branch: branches[0]._id,
        status: 'active'
      },
      {
        companyName: 'Local Hardware Store',
        contactPerson: {
          firstName: 'Vikram',
          lastName: 'Patel',
          designation: 'Owner'
        },
        email: 'vikram@localhardware.com',
        phone: '+919876543213',
        address: {
          street: '456 Market Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400006',
          country: 'India'
        },
        gstNumber: '27AABCU5678K2Y1',
        creditLimit: 50000,
        paymentTerms: 15,
        discount: 3,
        totalPurchases: 75000,
        totalOutstanding: 15000,
        accountStatus: 'good_standing',
        customerType: 'b2c',
        branch: branches[1]._id,
        status: 'active'
      }
    ]);

    // 7. Create Purchase Orders
    console.log('Creating purchase orders...');
    const purchaseOrders = await PurchaseOrder.insertMany([
      {
        purchaseOrderNumber: 'PO-20240423-001',
        supplier: suppliers[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 200,
            costPrice: 150,
            lineTotal: 30000
          },
          {
            product: products[1]._id,
            quantity: 150,
            costPrice: 180,
            lineTotal: 27000
          }
        ],
        summary: {
          subtotal: 57000,
          discount: 0,
          tax: 10260,
          totalAmount: 67260
        },
        amountDue: 33630,
        status: 'ordered',
        branch: branches[0]._id,
        createdBy: users[1]._id
      },
      {
        purchaseOrderNumber: 'PO-20240423-002',
        supplier: suppliers[1]._id,
        items: [
          {
            product: products[3]._id,
            quantity: 100,
            costPrice: 120,
            lineTotal: 12000
          }
        ],
        summary: {
          subtotal: 12000,
          discount: 0,
          tax: 2160,
          totalAmount: 14160
        },
        amountDue: 14160,
        status: 'received',
        branch: branches[1]._id,
        createdBy: users[1]._id
      }
    ]);

    // 8. Create Purchase Payments
    console.log('Creating purchase payments...');
    await PurchasePayment.insertMany([
      {
        paymentNumber: 'PP-20240423-001',
        purchaseOrder: purchaseOrders[0]._id,
        supplier: suppliers[0]._id,
        amount: 33630,
        paymentMethod: 'bank_transfer',
        status: 'confirmed',
        branch: branches[0]._id,
        createdBy: users[1]._id
      }
    ]);

    // 9. Create Orders
    console.log('Creating orders...');
    const orders = await Order.insertMany([
      {
        orderNumber: 'ORD-20240423-001',
        customer: customers[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 50,
            unitPrice: 225,
            discount: 0,
            tax: 18,
            lineTotal: 11250,
            lineProfit: 3750
          },
          {
            product: products[2]._id,
            quantity: 100,
            unitPrice: 40,
            discount: 0,
            tax: 18,
            lineTotal: 4000,
            lineProfit: 1500
          }
        ],
        summary: {
          subtotal: 15250,
          discount: 762.5,
          tax: 2596.5,
          shipping: 500,
          totalAmount: 17584,
          grossProfit: 5250
        },
        paymentMethod: 'credit',
        paymentStatus: 'partial',
        status: 'confirmed',
        branch: branches[0]._id,
        createdBy: users[2]._id
      },
      {
        orderNumber: 'ORD-20240423-002',
        customer: customers[1]._id,
        items: [
          {
            product: products[3]._id,
            quantity: 20,
            unitPrice: 180,
            discount: 0,
            tax: 18,
            lineTotal: 3600,
            lineProfit: 1200
          }
        ],
        summary: {
          subtotal: 3600,
          discount: 0,
          tax: 648,
          shipping: 200,
          totalAmount: 4448,
          grossProfit: 1200
        },
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        status: 'delivered',
        branch: branches[1]._id,
        createdBy: users[2]._id
      }
    ]);

    // 10. Create Invoices
    console.log('Creating invoices...');
    await Invoice.insertMany([
      {
        invoiceNumber: 'INV-20240423-001',
        order: orders[0]._id,
        customer: customers[0]._id,
        items: orders[0].items,
        summary: orders[0].summary,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'issued',
        branch: branches[0]._id
      },
      {
        invoiceNumber: 'INV-20240423-002',
        order: orders[1]._id,
        customer: customers[1]._id,
        items: orders[1].items,
        summary: orders[1].summary,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: 'paid',
        branch: branches[1]._id
      }
    ]);

    // 11. Create Inventory Movements
    console.log('Creating inventory movements...');
    await InventoryMovement.insertMany([
      {
        product: products[0]._id,
        quantity: 200,
        movementType: 'purchase',
        reference: 'PO-20240423-001',
        remarks: 'Received from ABC Plastics Ltd',
        status: 'approved',
        branch: branches[0]._id,
        createdBy: users[1]._id
      },
      {
        product: products[0]._id,
        quantity: -50,
        movementType: 'sales',
        reference: 'ORD-20240423-001',
        remarks: 'Sold to Metro Retail Chain',
        status: 'approved',
        branch: branches[0]._id,
        createdBy: users[2]._id
      },
      {
        product: products[3]._id,
        quantity: 100,
        movementType: 'purchase',
        reference: 'PO-20240423-002',
        remarks: 'Received from XYZ Polymers Pvt Ltd',
        status: 'approved',
        branch: branches[1]._id,
        createdBy: users[1]._id
      },
      {
        product: products[3]._id,
        quantity: -20,
        movementType: 'sales',
        reference: 'ORD-20240423-002',
        remarks: 'Sold to Local Hardware Store',
        status: 'approved',
        branch: branches[1]._id,
        createdBy: users[2]._id
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Branches: ${branches.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Suppliers: ${suppliers.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Purchase Orders: ${purchaseOrders.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log(`   Inventory Movements: 4`);

    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@ajz.com / demo123456');
    console.log('   Manager: manager@ajz.com / demo123456');
    console.log('   Staff: staff@ajz.com / demo123456');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();