import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { IAuthProvider, IUser, Role } from './user.interface';
import { User } from './user.model';
import bcryptjs from 'bcryptjs';
import { envVars } from '../../config/env';
import { JwtPayload } from 'jsonwebtoken';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { userSearchableFields } from '../../constants';

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, name, role } = payload;

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
    role,
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
    if (
      decodedUser.role === Role.SENDER ||
      decodedUser.role === Role.RECEIVER
    ) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized');
    }

    if (decodedUser.role !== Role.ADMIN) {
      throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized');
    }

    if (payload.password) {
      if (decodedUser.role !== Role.ADMIN) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          'Only admin can update any user password'
        );
      }

      const hashedPassword = await bcryptjs.hash(
        payload.password,
        envVars.BCRYPT_SALT_ROUND
      );
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
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'You are not allowed to update password here!'
    );
  }

  if (payload.role === 'ADMIN') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'You cannot Update your role INTO admin. Only admins can update user roles.'
    );
  }

  const newUpdatedProfile = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return newUpdatedProfile;
};

const getAllUser = async (
  decodedUser: JwtPayload,
  query: Record<string, string>
) => {
  const adminUser = await User.findById(decodedUser.userId);

  if (!adminUser || adminUser.role !== Role.ADMIN) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Only admin can access all users.'
    );
  }

  const users = User.find({
    role: { $in: [Role.SENDER, Role.RECEIVER] },
  });

  const queryBuilder = new QueryBuilder(users, query);


  const allUsers = queryBuilder
    .search(userSearchableFields)
    .filter()
    .paginate()

  const [data, meta] = await Promise.all([
    allUsers.build().exec(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

export const userServices = {
  createUser,
  updateUser,
  updateUserProfile,
  getAllUser,
};
