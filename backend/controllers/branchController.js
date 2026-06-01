import Branch from '../models/Branch.js';
import { validationResult } from 'express-validator';

export const createBranch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { code } = req.body;

    // Check if branch code already exists
    const existingBranch = await Branch.findOne({ code });
    if (existingBranch) {
      return res.status(400).json({
        status: 'error',
        message: 'Branch with this code already exists'
      });
    }

    const branch = new Branch(req.body);
    await branch.save();

    res.status(201).json({
      status: 'success',
      message: 'Branch created successfully',
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

export const getBranches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'active', search } = req.query;

    const query = {};
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const branches = await Branch.find(query)
      .populate('manager', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Branch.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: branches,
      pagination: {
        currentPage: parseInt(page),
        total,
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager', 'firstName lastName');

    if (!branch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'code', 'address', 'phone', 'email', 'manager', 'status', 'notes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName');

    if (!branch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Branch updated successfully',
      data: branch
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({
        status: 'error',
        message: 'Branch not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
