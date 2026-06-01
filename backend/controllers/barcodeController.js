import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { createCanvas } from 'canvas';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const generateProductBarcode = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { format = 'png', width = 2, height = 100 } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const barcodeValue = product.barcode || product.sku;

    const canvas = createCanvas(200, 100);
    const ctx = canvas.getContext('2d');

    JsBarcode(canvas, barcodeValue, {
      format: 'CODE128',
      width: parseInt(width),
      height: parseInt(height),
      displayValue: true
    });

    canvas.toBuffer((err, buffer) => {
      if (err) {
        return next(err);
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="barcode_${product.sku}.png"`);
      res.send(buffer);
    });
  } catch (error) {
    next(error);
  }
};

export const generateQRCode = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { format = 'image' } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const qrData = {
      sku: product.sku,
      name: product.name,
      price: product.sellingPrice,
      category: product.category,
      timestamp: new Date().toISOString()
    };

    const qrString = JSON.stringify(qrData);

    if (format === 'json') {
      return res.json({
        success: true,
        data: { qrData, encoded: Buffer.from(qrString).toString('base64') }
      });
    }

    const qrImage = await QRCode.toDataURL(qrString, { width: 300 });

    res.json({
      success: true,
      data: {
        qrCode: qrImage,
        productInfo: qrData
      }
    });
  } catch (error) {
    next(error);
  }
};

export const generateBulkBarcodes = async (req, res, next) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'productIds array is required' });
    }

    const products = await Product.find({ _id: { $in: productIds } }).lean();

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'No products found' });
    }

    const barcodes = products.map(product => ({
      productId: product._id,
      sku: product.sku,
      name: product.name,
      barcode: product.barcode || product.sku,
      sellingPrice: product.sellingPrice,
      category: product.category
    }));

    res.json({
      success: true,
      message: `Generated barcodes for ${barcodes.length} products`,
      data: barcodes
    });
  } catch (error) {
    next(error);
  }
};

export const scanBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ success: false, message: 'Barcode is required' });
    }

    const product = await Product.findOne({
      $or: [
        { barcode: barcode },
        { sku: barcode }
      ]
    })
      .populate('category', 'name')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: {
        product: {
          id: product._id,
          sku: product.sku,
          name: product.name,
          category: product.category?.name,
          currentStock: product.currentStock,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          wholesalePrice: product.wholesalePrice,
          reorderLevel: product.reorderLevel,
          status: product.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductBarcode = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ success: false, message: 'Barcode is required' });
    }

    const existingProduct = await Product.findOne({ barcode: barcode, _id: { $ne: productId } });
    if (existingProduct) {
      return res.status(409).json({ success: false, message: 'Barcode already exists for another product' });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { barcode },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Barcode updated successfully',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const getBarcodeStatistics = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const productsWithBarcode = await Product.countDocuments({ barcode: { $exists: true, $ne: null } });
    const productsWithoutBarcode = totalProducts - productsWithBarcode;

    res.json({
      success: true,
      data: {
        totalProducts,
        productsWithBarcode,
        productsWithoutBarcode,
        barcodePercentage: ((productsWithBarcode / totalProducts) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    next(error);
  }
};
