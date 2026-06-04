import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

/**
 * Aggregates all necessary metrics for the Monthly ERP Report.
 */
export const generateReportData = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(); // Today

    const dateFilter = {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    };

    // 1. Financial Summary
    const salesData = await Invoice.aggregate([
        { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$summary.totalAmount' },
                totalPaid: { $sum: '$summary.paidAmount' },
                totalDue: { $sum: '$summary.dueAmount' }
            }
        }
    ]);

    const purchaseData = await PurchaseOrder.aggregate([
        { $match: { ...dateFilter, status: { $in: ['received', 'paid'] } } },
        {
            $group: {
                _id: null,
                totalPurchases: { $sum: '$summary.totalAmount' }
            }
        }
    ]);

    // Operational metrics from Orders
    const orderMetrics = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalCost: { $sum: '$summary.totalCost' },
                grossProfit: { $sum: '$summary.grossProfit' }
            }
        }
    ]);

    const receivables = await Customer.aggregate([
        { $group: { _id: null, totalOutstanding: { $sum: '$totalOutstanding' } } }
    ]);

    const payables = await Supplier.aggregate([
        { $group: { _id: null, totalOutstanding: { $sum: '$totalOutstanding' } } }
    ]);

    // 2. Customer Summary
    const totalCustomers = await Customer.countDocuments({ status: 'active' });
    const pendingCustomers = await Customer.find({ totalOutstanding: { $gt: 0 } })
        .select('companyName totalOutstanding overdueDays accountStatus')
        .sort({ totalOutstanding: -1 })
        .limit(10);

    // 3. Supplier Summary
    const totalSuppliers = await Supplier.countDocuments({ status: 'active' });
    const pendingSuppliers = await Supplier.find({ totalOutstanding: { $gt: 0 } })
        .select('companyName totalOutstanding overdueDays accountStatus')
        .sort({ totalOutstanding: -1 })
        .limit(10);

    // 4. Inventory Summary
    const totalProducts = await Product.countDocuments({ status: 'active' });
    const lowStockItems = await Product.find({
        $expr: { $lte: ['$stocks.totalStock', '$stocks.reorderLevel'] },
        status: 'active'
    }).select('name sku stocks category');

    const outOfStockItems = await Product.find({
        'stocks.totalStock': { $lte: 0 },
        status: 'active'
    }).select('name sku stocks category');

    const inventoryValuation = await Product.aggregate([
        { $match: { status: 'active' } },
        {
            $group: {
                _id: null,
                totalValue: { $sum: { $multiply: ['$stocks.totalStock', '$costPrice'] } }
            }
        }
    ]);

    return {
        period: {
            start: startOfMonth,
            end: endOfMonth
        },
        financials: {
            totalSales: salesData[0]?.totalSales || 0,
            totalPurchases: purchaseData[0]?.totalPurchases || 0,
            totalRevenue: salesData[0]?.totalSales || 0,
            totalPaid: salesData[0]?.totalPaid || 0,
            totalDue: salesData[0]?.totalDue || 0,
            grossProfit: orderMetrics[0]?.grossProfit || 0,
            netProfit: (orderMetrics[0]?.grossProfit || 0) - 0, // 0 is placeholder for expenses
            outstandingReceivables: receivables[0]?.totalOutstanding || 0,
            outstandingPayables: payables[0]?.totalOutstanding || 0
        },
        customers: {
            total: totalCustomers,
            pending: pendingCustomers
        },
        suppliers: {
            total: totalSuppliers,
            pending: pendingSuppliers
        },
        inventory: {
            totalProducts,
            lowStockCount: lowStockItems.length,
            outOfStockCount: outOfStockItems.length,
            valuation: inventoryValuation[0]?.totalValue || 0,
            lowStockItems: lowStockItems.slice(0, 5),
            outOfStockItems: outOfStockItems.slice(0, 5)
        },
        operational: {
            totalOrders: orderMetrics[0]?.totalOrders || 0
        }
    };
};

/**
 * Formats the report data into an HTML template.
 */
export const formatReportHTML = (data) => {
    const { financials, customers, suppliers, inventory, operational, period } = data;

    const formatDate = (date) => new Date(date).toLocaleDateString();

    return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
      <div style="background-color: #1a202c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Monthly ERP Executive Report</h1>
        <p style="margin: 5px 0 0;">Reporting Period: ${formatDate(period.start)} - ${formatDate(period.end)}</p>
      </div>

      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #2d3748; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">Executive Summary</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px;">
            <p style="margin: 0; color: #718096; font-size: 14px;">Total Sales</p>
            <h3 style="margin: 5px 0 0; color: #38a169;">₨ ${financials.totalSales.toLocaleString()}</h3>
          </div>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px;">
            <p style="margin: 0; color: #718096; font-size: 14px;">Net Profit</p>
            <h3 style="margin: 5px 0 0; color: #3182ce;">₨ ${financials.netProfit.toLocaleString()}</h3>
          </div>
        </div>

        <h2 style="color: #2d3748; border-bottom: 2px solid #edf2f7; padding-bottom: 10px; margin-top: 30px;">Financial Performance</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">Total Sales Invoices</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right;">${operational.totalOrders}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">Total Revenue</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right;">₨ ${financials.totalRevenue.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">Total Purchases</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right;">₨ ${financials.totalPurchases.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; font-weight: bold;">Gross Profit</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; font-weight: bold;">₨ ${financials.grossProfit.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">Outstanding Receivables</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; color: #e53e3e;">₨ ${financials.outstandingReceivables.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">Outstanding Payables</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; color: #e53e3e;">₨ ${financials.outstandingPayables.toLocaleString()}</td>
          </tr>
        </table>

        <h2 style="color: #2d3748; border-bottom: 2px solid #edf2f7; padding-bottom: 10px; margin-top: 30px;">Inventory Overview</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div style="text-align: center; padding: 10px; background-color: #ebf8ff; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #2b6cb0;">Total Products</p>
            <p style="margin: 5px 0 0; font-weight: bold;">${inventory.totalProducts}</p>
          </div>
          <div style="text-align: center; padding: 10px; background-color: #fff5f5; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #c53030;">Low Stock</p>
            <p style="margin: 5px 0 0; font-weight: bold;">${inventory.lowStockCount}</p>
          </div>
          <div style="text-align: center; padding: 10px; background-color: #fefcbf; border-radius: 6px;">
            <p style="margin: 0; font-size: 12px; color: #b7791f;">Stock Valuation</p>
            <p style="margin: 5px 0 0; font-weight: bold;">₨ ${inventory.valuation.toLocaleString()}</p>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #a0aec0;">
          <p>This is an automated system-generated report from AJ Traders ERP.</p>
          <p>&copy; ${new Date().getFullYear()} AJ Traders. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};
