import { JwtPayload } from "jsonwebtoken";
import { Parcel } from "../parcel/parcel.model";
import { User } from "../user/user.model";

const getParcelsStats = async (decodedUser: JwtPayload) => {
  const isUserAdmin = decodedUser.role === 'ADMIN';
  if (!isUserAdmin) {
    throw new Error('Unauthorized access');
  }
  const parcelStats = await Parcel.aggregate([
    {
      $group: {
        _id: '$currentStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const dailyTrend = await Parcel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          status: '$currentStatus',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.day',
        statuses: {
          $push: { status: '$_id.status', count: '$count' },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlyShipments = await Parcel.aggregate([
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
        },
        total: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const topSenders = await Parcel.aggregate([
    {
      $group: {
        _id: '$senderId',
        totalParcels: { $sum: 1 },
      },
    },
    { $sort: { totalParcels: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'sender',
      },
    },
    { $unwind: '$sender' },
    {
      $project: {
        _id: 0,
        senderId: '$sender._id',
        name: '$sender.name',
        email: '$sender.email',
        totalParcels: 1,
      },
    },
  ]);

  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    parcelStats,
    dailyTrend,
    monthlyShipments,
    topSenders,
    userStats,
  };
};


export const getUserStats = async (decodedUser: JwtPayload) => {
  const isUserAdmin = decodedUser.role === 'ADMIN';
  if (!isUserAdmin) {
    throw new Error('Unauthorized access');
  }
  // 1. Role wise distribution
  const roleStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  // 2. Active vs Inactive
  const activeUsers = await User.countDocuments({ isActive: 'ACTIVE' });
  const inactiveUsers = await User.countDocuments({ isActive: 'INACTIVE' });

  // 3. Verified vs Unverified
  const verifiedUsers = await User.countDocuments({ isVerified: true });
  const unverifiedUsers = await User.countDocuments({ isVerified: false });

  // 4. Monthly Growth (last 6 months)
  const monthlyGrowth = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // 5. Auth Provider stats
  const providerStats = await User.aggregate([
    { $unwind: '$auths' },
    {
      $group: {
        _id: '$auths.provider',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    roleStats,
    activeInactive: { active: activeUsers, inactive: inactiveUsers },
    verification: { verified: verifiedUsers, unverified: unverifiedUsers },
    monthlyGrowth,
    providerStats,
  };
};
export const statsService = {
  getParcelsStats,
  getUserStats,
};
