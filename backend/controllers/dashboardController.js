import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';

// Get sales overview (daily, weekly, monthly)
export const getSalesOverview = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    let dateRange;
    let groupBy;

    switch (period) {
      case 'daily':
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupBy = {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        };
        break;
      case 'weekly':
        dateRange = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        groupBy = {
          $week: '$createdAt'
        };
        break;
      case 'monthly':
      default:
        dateRange = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        groupBy = {
          $month: '$createdAt'
        };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: period === 'daily' ? groupBy : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalSales: { $sum: '$summary.totalAmount' },
          totalOrders: { $sum: 1 },
          totalCost: { $sum: '$summary.totalCost' },
          totalProfit: { $sum: '$summary.grossProfit' },
          cashSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$summary.totalAmount', 0]
            }
          },
          creditSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'credit'] }, '$summary.totalAmount', 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: salesData
    });
  } catch (error) {
    next(error);
  }
};

// Get revenue and receivables summary
export const getRevenueMetrics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Total revenue
    const revenueData = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$summary.totalAmount' },
          totalCost: { $sum: '$summary.totalCost' },
          totalProfit: { $sum: '$summary.grossProfit' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Revenue last 30 days
    const revenueLastMonth = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$summary.totalAmount' },
          orders: { $sum: 1 }
        }
      }
    ]);

    // Outstanding receivables
    const outstandingReceivables = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$totalOutstanding' },
          activeCustomers: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Cash vs Credit breakdown
    const paymentBreakdown = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$summary.totalAmount' },
          orders: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue: revenueData[0] || {},
        revenueLastMonth: revenueLastMonth[0] || {},
        outstandingReceivables: outstandingReceivables[0] || {},
        paymentMethodBreakdown: paymentBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get customer intelligence
export const getCustomerIntelligence = async (req, res, next) => {
  try {
    // Top customers by revenue
    const topCustomers = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$summary.totalAmount' },
          orderCount: { $sum: 1 },
          totalProfit: { $sum: '$summary.grossProfit' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 1,
          companyName: '$customerInfo.companyName',
          totalSpent: 1,
          orderCount: 1,
          totalProfit: 1,
          email: '$customerInfo.email'
        }
      }
    ]);

    // Overdue accounts
    const overdueAccounts = await Customer.find({
      accountStatus: { $in: ['overdue', 'delinquent'] }
    }).select('companyName email totalOutstanding overdueDays accountStatus').limit(10);

    // Active customers
    const activeCustomers = await Customer.countDocuments({ status: 'active' });

    // High outstanding balances
    const highOutstanding = await Customer.find({
      totalOutstanding: { $gt: 0 },
      status: 'active'
    })
      .select('companyName email totalOutstanding creditLimit')
      .sort({ totalOutstanding: -1 })
      .limit(10);

    const overdueAging = {
      '30_days': await Customer.countDocuments({
        overdueDays: { $gte: 30, $lt: 60 },
        totalOutstanding: { $gt: 0 }
      }),
      '60_days': await Customer.countDocuments({
        overdueDays: { $gte: 60, $lt: 90 },
        totalOutstanding: { $gt: 0 }
      }),
      '90_plus_days': await Customer.countDocuments({
        overdueDays: { $gte: 90 },
        totalOutstanding: { $gt: 0 }
      })
    };

    res.status(200).json({
      status: 'success',
      data: {
        topCustomers,
        overdueAccounts,
        activeCustomers,
        highOutstandingBalances: highOutstanding,
        overdueAging
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory overview
export const getInventoryOverview = async (req, res, next) => {
  try {
    // Total products and categories
    const totalProducts = await Product.countDocuments({ status: 'active' });
    const totalCategories = await (await Product.distinct('category')).length;

    // Low stock items
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$stocks.totalStock', '$stocks.reorderLevel'] }
    })
      .select('name sku stocks category')
      .limit(10);

    // Stock valuation
    const stockValuation = await Product.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: '$stocks.totalStock' },
          totalValue: {
            $sum: { $multiply: ['$stocks.totalStock', '$costPrice'] }
          },
          retailValue: {
            $sum: { $multiply: ['$stocks.totalStock', '$sellingPrice'] }
          }
        }
      }
    ]);

    // Fast and slow moving items (based on sales trends)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const fastMoving = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          quantity: { $sum: '$items.quantity' }
        }
      },
      {
        $sort: { quantity: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $project: {
          _id: 1,
          name: '$productInfo.name',
          sku: '$productInfo.sku',
          category: '$productInfo.category',
          quantity: 1
        }
      }
    ]);

    const slowMoving = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: ninetyDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' }
        }
      },
      {
        $sort: { quantitySold: 1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $project: {
          _id: 1,
          name: '$productInfo.name',
          sku: '$productInfo.sku',
          category: '$productInfo.category',
          quantitySold: 1
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalProducts,
        totalCategories,
        lowStockItems,
        stockValuation: stockValuation[0] || {},
        fastMovingItems: fastMoving,
        slowMovingItems: slowMoving
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get sales analytics
export const getSalesAnalytics = async (req, res, next) => {
  try {
    // Product performance
    const productPerformance = await Order.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
          profit: { $sum: '$items.lineProfit' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Daily sales trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailyTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          sales: { $sum: '$summary.totalAmount' },
          orders: { $sum: 1 },
          profit: { $sum: '$summary.grossProfit' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const monthlyTrend = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          sales: { $sum: '$summary.totalAmount' },
          orders: { $sum: 1 },
          profit: { $sum: '$summary.grossProfit' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        productPerformance,
        dailyTrend,
        monthlyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get executive dashboard summary
export const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Today's sales
    const todaySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$summary.totalAmount' },
          orders: { $sum: 1 },
          profit: { $sum: '$summary.grossProfit' }
        }
      }
    ]);

    // Summary metrics
    const summaryData = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Customer.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'active' }),
      Customer.aggregate([{ $group: { _id: null, total: { $sum: '$totalOutstanding' } } }])
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        todaySales: todaySales[0] || {},
        activeCustomers: summaryData[1],
        activeProducts: summaryData[2],
        totalOutstanding: summaryData[3][0]?.total || 0,
        metrics: {
          orders: summaryData[0],
          customers: summaryData[1],
          products: summaryData[2]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Sales Reports
export const getSalesReports = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: end
        }
      };
    } else {
      const now = new Date();
      switch (period) {
        case 'daily':
          dateFilter.createdAt = {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          };
          break;
        case 'weekly':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          dateFilter.createdAt = { $gte: weekStart };
          break;
        case 'monthly':
          dateFilter.createdAt = {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1)
          };
          break;
        case 'yearly':
          dateFilter.createdAt = {
            $gte: new Date(now.getFullYear(), 0, 1)
          };
          break;
      }
    }

    const salesReport = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$summary.totalAmount' },
          totalOrders: { $sum: 1 },
          totalCost: { $sum: '$summary.totalCost' },
          totalProfit: { $sum: '$summary.grossProfit' },
          averageOrderValue: { $avg: '$summary.totalAmount' },
          cashSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$summary.totalAmount', 0]
            }
          },
          creditSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'credit'] }, '$summary.totalAmount', 0]
            }
          }
        }
      }
    ]);

    const topProducts = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
          profit: { $sum: '$items.lineProfit' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $sort: { revenue: -1 }
      },
      { $limit: 10 },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          quantitySold: 1,
          revenue: 1,
          profit: 1
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: salesReport[0] || {},
        topProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

// Profit and Loss Report
export const getProfitLossReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: end
        }
      };
    }

    // Sales revenue and cost
    const salesData = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$summary.totalAmount' },
          totalCostOfGoods: { $sum: '$summary.totalCost' },
          grossProfit: { $sum: '$summary.grossProfit' }
        }
      }
    ]);

    // Purchase costs
    const purchaseData = await PurchaseOrder.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ['received', 'paid'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: '$summary.totalAmount' }
        }
      }
    ]);

    // Operating expenses (placeholder - would need expense tracking)
    const operatingExpenses = 0; // To be implemented with expense module

    const profitLoss = {
      revenue: salesData[0]?.totalRevenue || 0,
      costOfGoodsSold: salesData[0]?.totalCostOfGoods || 0,
      grossProfit: salesData[0]?.grossProfit || 0,
      operatingExpenses,
      netProfit: (salesData[0]?.grossProfit || 0) - operatingExpenses
    };

    res.status(200).json({
      status: 'success',
      data: profitLoss
    });
  } catch (error) {
    next(error);
  }
};

// Customer Outstanding Reports
export const getCustomerOutstandingReports = async (req, res, next) => {
  try {
    const { aging = false } = req.query;

    if (aging) {
      // Aging report
      const agingReport = await Customer.aggregate([
        {
          $match: { totalOutstanding: { $gt: 0 } }
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ['$overdueDays', 30] }, then: 'current' },
                  { case: { $and: [{ $gt: ['$overdueDays', 30] }, { $lte: ['$overdueDays', 60] }] }, then: '31-60' },
                  { case: { $and: [{ $gt: ['$overdueDays', 60] }, { $lte: ['$overdueDays', 90] }] }, then: '61-90' }
                ],
                default: '91+'
              }
            },
            count: { $sum: 1 },
            amount: { $sum: '$totalOutstanding' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.status(200).json({
        status: 'success',
        data: agingReport
      });
    } else {
      // Outstanding balances report
      const outstandingReport = await Customer.find({
        totalOutstanding: { $gt: 0 },
        status: 'active'
      })
        .select('companyName email phone totalOutstanding overdueDays accountStatus lastPaymentDate')
        .sort({ totalOutstanding: -1 })
        .lean();

      const formattedCustomers = outstandingReport.map(c => ({
        customerName: c.companyName,
        outstanding: c.totalOutstanding,
        overdue: ['overdue', 'delinquent'].includes(c.accountStatus) ? c.totalOutstanding : 0,
        daysOverdue: c.overdueDays || 0
      }));

      const summary = await Customer.aggregate([
        {
          $match: { totalOutstanding: { $gt: 0 } }
        },
        {
          $group: {
            _id: null,
            totalOutstanding: { $sum: '$totalOutstanding' },
            overdueAmount: {
              $sum: {
                $cond: [
                  { $in: ['$accountStatus', ['overdue', 'delinquent']] },
                  '$totalOutstanding',
                  0
                ]
              }
            },
            customerCount: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          customers: formattedCustomers,
          summary: summary[0] || { totalOutstanding: 0, overdueAmount: 0, customerCount: 0 }
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Inventory Valuation Reports
export const getInventoryValuationReports = async (req, res, next) => {
  try {
    const { valuationMethod = 'cost' } = req.query; // cost, retail, average

    const valuationReport = await Product.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$category',
          products: { $sum: 1 },
          totalQuantity: { $sum: '$stocks.totalStock' },
          totalCostValue: {
            $sum: { $multiply: ['$stocks.totalStock', '$costPrice'] }
          },
          totalRetailValue: {
            $sum: { $multiply: ['$stocks.totalStock', '$sellingPrice'] }
          }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          category: '$categoryInfo.name',
          products: 1,
          totalQuantity: 1,
          totalCostValue: 1,
          totalRetailValue: 1,
          averageCost: { $divide: ['$totalCostValue', '$totalQuantity'] },
          averageRetail: { $divide: ['$totalRetailValue', '$totalQuantity'] }
        }
      },
      { $sort: { totalCostValue: -1 } }
    ]);

    const overallSummary = await Product.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalItems: { $sum: '$stocks.totalStock' },
          totalCostValue: {
            $sum: { $multiply: ['$stocks.totalStock', '$costPrice'] }
          },
          totalRetailValue: {
            $sum: { $multiply: ['$stocks.totalStock', '$sellingPrice'] }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        byCategory: valuationReport,
        overall: overallSummary[0] || {},
        summary: {
          totalValue: overallSummary[0]?.totalCostValue || 0,
          totalItems: overallSummary[0]?.totalItems || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

