// Backend utilities

export const generateOrderNumber = async (Order) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Order.countDocuments({
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    }
  });
  return `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

export const calculateProfitMetrics = (items) => {
  let subtotal = 0;
  let totalCost = 0;
  let totalProfit = 0;

  items.forEach(item => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemCost = item.quantity * item.costPrice;
    const itemProfit = itemSubtotal - itemCost;

    subtotal += itemSubtotal;
    totalCost += itemCost;
    totalProfit += itemProfit;
  });

  const profitMargin = subtotal > 0 ? (totalProfit / subtotal) * 100 : 0;

  return {
    subtotal,
    totalCost,
    totalProfit,
    profitMargin
  };
};

export const getDateRange = (period) => {
  const today = new Date();
  let startDate;

  switch (period) {
    case 'daily':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    case 'weekly':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      break;
    case 'monthly':
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    default:
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
  }

  return { startDate, endDate: today };
};

export const calculateOverdayDays = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const getAccountStatus = (outstanding, daysOverdue) => {
  if (outstanding === 0) {
    return 'good_standing';
  }
  if (daysOverdue > 90) {
    return 'delinquent';
  }
  if (daysOverdue > 30) {
    return 'overdue';
  }
  return 'at_risk';
};

export const generateInvoiceNumber = async (Invoice) => {
  const count = await Invoice.countDocuments();
  return `AJZ-INV-${String(count + 1).padStart(6, '0')}`;
};

export const validateOrderData = (order) => {
  const errors = [];

  if (!order.customer) {
    errors.push('Customer is required');
  }

  if (!order.items || order.items.length === 0) {
    errors.push('Order must have at least one item');
  }

  if (!order.paymentMethod) {
    errors.push('Payment method is required');
  }

  order.items?.forEach((item, idx) => {
    if (!item.product) {
      errors.push(`Item ${idx + 1}: Product is required`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${idx + 1}: Valid quantity is required`);
    }
    if (!item.unitPrice || item.unitPrice < 0) {
      errors.push(`Item ${idx + 1}: Valid unit price is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
