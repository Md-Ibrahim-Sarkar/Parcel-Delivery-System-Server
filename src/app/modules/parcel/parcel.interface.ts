import { Types } from "mongoose";


export enum ParcelStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
export interface IStatusHistory {
  status: ParcelStatus;
  updatedAt: Date;
  updatedBy: Types.ObjectId; 
}

export interface IParcel {
  trackingId: string;
  senderId: Types.ObjectId;
  receiverEmail: string;
  parcelDetails: {
    address: string;
    phone: string;
    weight: number;
    note?: string;
  };
  fee?: number;
  currentStatus: ParcelStatus;
  statusHistory: IStatusHistory[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
