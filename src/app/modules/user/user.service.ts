import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { IAuthProvider, IUser, Role } from './user.interface';
import { User } from './user.model';
import bcryptjs from 'bcryptjs';
import { envVars } from '../../config/env';
import { JwtPayload } from 'jsonwebtoken';

const createUser = async (payload: Partial<IUser>) => {
  const { email, password,name } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User Already Exist');
  }

  const isHashPassword = await bcryptjs.hash(
    password as string,
    envVars.BCRYPT_SALT_ROUND
  );

  const authProvider: IAuthProvider = {
    provider: 'Email',
    providerId: email as string,
  };

  const userPayload = {
    email,
    password: isHashPassword,
    auths: [authProvider],
    name,
  };

  const user = await User.create(userPayload);

  return user;
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedUser: JwtPayload
) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User Not Found');
  }

  if (decodedUser.role) {
    if ( decodedUser.role === Role.SENDER || decodedUser.role === Role.RECEIVER) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized');
    }

    if (decodedUser.role !== Role.ADMIN) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized');
    }


    if (payload.password) { 
      if (decodedUser.role !== Role.ADMIN) {
          throw new AppError(  StatusCodes.FORBIDDEN,  'Only admin can update password');
      }

      const hashedPassword = await bcryptjs.hash(payload.password, envVars.BCRYPT_SALT_ROUND);
      payload.password = hashedPassword;
    }


    const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
      new: true,
      runValidators: true,
    });

    return newUpdatedUser;
  }
};


const updateUserProfile = async (
  userId: string,
  payload: Partial<IUser>,
  decodedUser: JwtPayload
) => { 
  const isUserExist = await User.findById(userId);


 if (!isUserExist) {
   throw new AppError(StatusCodes.NOT_FOUND, 'User Not Found');
  }
  

  if (isUserExist.role !== decodedUser.role) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You are not authorized');
  }

  if (payload.password) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You are not allowed to update password here!' );
  }

  if (payload.role) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'You cannot Update your role. Only admins can update user roles.'
    );
    
  }

   const newUpdatedProfile = await User.findByIdAndUpdate(userId, payload, {
     new: true,
     runValidators: true,
   });

   return newUpdatedProfile;

}

const getAllUser = async (decodedUser: JwtPayload) => {
   const adminUser = await User.findById(decodedUser.userId);

   if (!adminUser || adminUser.role !== Role.ADMIN) {
     throw new AppError(
       StatusCodes.FORBIDDEN,
       'Only admin can access all users.'
     );
   }
  const users = await User.find({})
  const totalUser = await User.countDocuments()

  return {
    data: users,
    meta: {
      total: totalUser
    }
  }
}

export const userServices = { createUser, updateUser, updateUserProfile, getAllUser };
