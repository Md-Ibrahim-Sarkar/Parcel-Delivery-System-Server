import { Types } from "mongoose";

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED"
}

export enum Role {
  ADMIN = 'ADMIN',
  SENDER = 'SENDER',
  RECEIVER = 'RECEIVER',
}

export interface IAuthProvider {
  provider: string; 
  providerId: string;
}


export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  picture?: string;
  address?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  role: Role;
  auths: IAuthProvider[];
  sentParcels: Types.ObjectId[];
  receivedParcels: Types.ObjectId[];
  createdAt?: Date;
}