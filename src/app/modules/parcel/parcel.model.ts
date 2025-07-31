import { model, Schema } from "mongoose";
import { IParcel, IStatusHistory, ParcelStatus } from "./parcel.interface";








const statusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: Object.values(ParcelStatus),
      default: ParcelStatus.PENDING,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false, versionKey: false }
);



const parcelSchema = new Schema<IParcel>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverEmail: {
      type: String,
      required: true,
    },
    parcelDetails: {
      weight: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
      },
      note: String,
    },
    currentStatus: {
      type: String,
      enum: Object.values(ParcelStatus),
      default: ParcelStatus.PENDING,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    fee: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true,
  }
);


export const Parcel = model<IParcel>('Parcel', parcelSchema);