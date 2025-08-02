import { JwtPayload } from "jsonwebtoken";
import { IParcel, ParcelStatus } from "./parcel.interface";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
import { IsActive, Role } from "../user/user.interface";
import { Parcel } from "./parcel.model";
import mongoose from "mongoose";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { notAllowedStatus } from "../../constants";


const createParcel = async (
  payload: Partial<IParcel>,
  decodedUser: JwtPayload
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await User.findById(decodedUser.userId).session(session);

    if (!sender) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'User not found.');
    }

    if (sender.role !== Role.SENDER) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'Only senders can create parcels.'
      );
    }

    if (sender.isDeleted || sender.isActive === IsActive.BLOCKED) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Your account is deleted or blocked.'
      );
    }

    if (!payload.receiverEmail) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Receiver email is required.'
      );
    }

    const receiver = await User.findOne({
      email: payload.receiverEmail,
    }).session(session);
    if (!receiver || receiver.role !== Role.RECEIVER) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid receiver.');
    }

    const weight = payload.parcelDetails?.weight;
    if (!weight) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Parcel weight is required.');
    }

    const fee = (payload.fee as number) * weight;

    const generateTrackingId = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(100000 + Math.random() * 900000);
      return `TRK-${year}${month}${day}-${random}`;
    };

    const trackingId = generateTrackingId();

    const parcel = await Parcel.create(
      [
        {
          ...payload,
          senderId: sender._id,
          receiverEmail: payload.receiverEmail,
          trackingId,
          fee,
          statusHistory: [
            {
              status: ParcelStatus.PENDING,
              updatedAt: new Date(),
              updatedBy: sender._id,
            },
          ],
        },
      ],
      { session }
    );

    sender.Parcels.push(parcel[0]._id);
    await sender.save({ session });

    await session.commitTransaction();
    session.endSession();

    return parcel[0];
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(StatusCodes.FAILED_DEPENDENCY, error.message);
  }
};



const updateParcel = async (parcelId: string, payload: Partial<IParcel>, decodedUser: JwtPayload) => {

  const parcel = await Parcel.findById(parcelId);

  const user = await User.findById(decodedUser.userId)

  if (decodedUser.role === Role.RECEIVER) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Only sender and Admin can update parcel');
  }

  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }
   if (user?.isActive === IsActive.BLOCKED) {
     throw new AppError(StatusCodes.BAD_REQUEST, 'User is Blocked');
   }

  if (parcel.senderId.toString() !== decodedUser.userId) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You are not the sender of this parcel');
  }

 if (payload.currentStatus) {
   throw new AppError(
     StatusCodes.FORBIDDEN,
     'You are not allowed to update the parcel status through this request.'
   );
 }

  const { currentStatus, statusHistory, ...senderPayload } = payload;


  const updatedParcel = await Parcel.findByIdAndUpdate(parcelId, senderPayload, {
    new: true,
    runValidators: true,
  });

  return updatedParcel;
};



const cancelParcel = async (parcelId: string, decodedUser: JwtPayload) => {

  const session = await mongoose.startSession()
  session.startTransaction();
   
  try {
    const parcel = await Parcel.findById(parcelId);
    const user = await User.findById(decodedUser.userId);

    if (!parcel) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found.');
    }

     if (user?.isActive === IsActive.BLOCKED) {
       throw new AppError(StatusCodes.BAD_REQUEST, 'User is Blocked');
     }

    if (!user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found.');
    }

    if (
      user.role !== Role.SENDER ||
      parcel.senderId.toString() !== user._id.toString()
    ) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to cancel this parcel.'
      );
    }

    if (parcel.currentStatus !== ParcelStatus.PENDING) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Only pending parcels can be cancelled.'
      );
    }


    parcel.currentStatus = ParcelStatus.CANCELLED;
    parcel.statusHistory.push({
      status: ParcelStatus.CANCELLED,
      updatedAt: new Date(),
      updatedBy: user._id,
    });

    await parcel.save({session});

    await session.commitTransaction();
    session.endSession()

    return parcel;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
   throw new AppError(StatusCodes.FAILED_DEPENDENCY, error.message);


  }
};


const getAllParcels = async (decodedUser:JwtPayload , allQuery : Record<string, string>) => {
   const user = await User.findById(decodedUser.userId);

   if (!user) {
     throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  
  if (user.isActive === IsActive.BLOCKED) {
     throw new AppError(StatusCodes.BAD_REQUEST, 'User is Blocked');
  }

   let query = {};

   if (user.role === Role.SENDER) {
     query = { senderId: user._id };
   } else if (user.role === Role.RECEIVER) {
     query = { receiverEmail: user.email };
   } else if (user.role === Role.ADMIN) {
     query = {};
  }
  
  const parcels =  Parcel.find(query);

  const queryBuilder = new QueryBuilder(parcels, allQuery)

  const allParcels = queryBuilder.filter().paginate()
  

  const [data, meta] = await Promise.all([
    allParcels.build().exec(),
    queryBuilder.getMeta()
  ])

  return {
    data,
    meta
  };
}

const getAParcel = async (parcelId: string, decodedUser: JwtPayload) => {
  const user = await User.findById(decodedUser.userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.isActive === IsActive.BLOCKED) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is Blocked');
  }

  const parcel = await Parcel.findById(parcelId);
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  // Access control check
  if (
    user.role === Role.SENDER &&
    parcel.senderId.toString() !== user._id.toString()
  ) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Access denied to this parcel');
  }

  if (user.role === Role.RECEIVER && parcel.receiverEmail !== user.email) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Access denied to this parcel');
  }

  // Admin can access everything
  return parcel;
};



//  fpr Receivers
const receiverIncomingParcels = async (decodedUser: JwtPayload) => {
  const user = await User.findById(decodedUser.userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.role !== Role.RECEIVER) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only receivers can view incoming parcels'
    );
  }

  const query = {
    receiverEmail: user.email,
    currentStatus: { $ne: ParcelStatus.DELIVERED },
  };

  const IncomingParcels = await Parcel.find(query);
  const totalIncomingParcels = await Parcel.countDocuments(query);

  return {
    data: IncomingParcels,
    meta: {
      total: totalIncomingParcels,
    },
  };
};


const confirmDelivery = async (parcelId: string, decodedUser: JwtPayload) => {

   const session = await mongoose.startSession();
        session.startTransaction();
  
  try {
    const receiver = await User.findById(decodedUser.userId).session(session);
    if (!receiver) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (receiver.role !== Role.RECEIVER) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'Only receivers can confirm delivery'
      );
    }

    const parcel = await Parcel.findById(parcelId).session(session);
    if (!parcel) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
    }

    if (parcel.receiverEmail.toString() !== receiver.email.toString()) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to confirm this parcel'
      );
    }

    if (parcel.currentStatus === ParcelStatus.CONFIRMED) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Parcel has already been confirmed by the receiver.'
      );
    }


    parcel.currentStatus = ParcelStatus.CONFIRMED;
    parcel.statusHistory.push({
      status: ParcelStatus.CONFIRMED,
      updatedAt: new Date(),
      updatedBy: receiver._id,
    })


    await parcel.save({ session });

    await session.commitTransaction();
    session.endSession();

    return parcel;
  } catch (error: any) {
   await session.abortTransaction();
    session.endSession();

   throw new AppError(StatusCodes.FAILED_DEPENDENCY,  error.message);
  }
};


const getDeliveryHistory = async (decodedUser: JwtPayload) => {
  const user = await User.findById(decodedUser.userId);

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found');
  }

  let deliveredParcels;

  if (user.role === Role.RECEIVER) {
      deliveredParcels = await Parcel.find({
        receiverEmail: user.email,
        currentStatus: { $in: [ParcelStatus.DELIVERED, ParcelStatus.CONFIRMED] },
      });

  } else if (user.role === Role.SENDER) {

      deliveredParcels = await Parcel.find({
        senderId: user._id,
        currentStatus: { $in: [ParcelStatus.DELIVERED, ParcelStatus.CONFIRMED] },
      });

  } else {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only sender or receiver can view delivery history'
    );
  }

  return deliveredParcels;
};


const updateParcelStatus = async (
  parcelId: string,
  payload: Partial<IParcel>,
  decodedUser: JwtPayload
) => {
  if (decodedUser.role !== 'ADMIN') {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only admin can update parcel status'
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parcel = await Parcel.findById(parcelId).session(session);
    if (!parcel) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
    }

    if (
      payload.currentStatus &&
      payload.currentStatus !== parcel.currentStatus
    ) {
      parcel.statusHistory.push({
        status: payload.currentStatus,
        updatedAt: new Date(),
        updatedBy: decodedUser.userId,
      });

      parcel.currentStatus = payload.currentStatus;
    } else {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'Invalid or duplicate status'
      );
    }

    const updatedParcel = await parcel.save({ session });

    await session.commitTransaction();
    session.endSession();

    return updatedParcel;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
  throw new AppError(StatusCodes.FAILED_DEPENDENCY, error.message);

  }
};


const deleteParcel = async (parcelId: string, decodedUser: JwtPayload) => {
  const parcel = await Parcel.findById(parcelId);

  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found!');
  }

  const userId = decodedUser.userId;
  const role = decodedUser.role;


  if (role === Role.SENDER) {
    const isOwner = parcel.senderId.toString() === userId;
    if (!isOwner) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        'You are not the owner of this parcel.'
      );
    }


    if (notAllowedStatus.includes(parcel.currentStatus)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'CONFIRMED, APPROVED or delivered parcels cannot be deleted by sender.'
      );
    }
  }

  if (role === 'receiver') {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Receivers are not allowed to delete parcels.'
    );
  }

  parcel.isDeleted = true;
  await parcel.save();
};

export const parcelServies = {
  createParcel,
  cancelParcel,
  getAllParcels,
  getAParcel,
  receiverIncomingParcels,
  confirmDelivery,
  getDeliveryHistory,
  updateParcelStatus,
  updateParcel,
  deleteParcel,
};