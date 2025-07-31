import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { IAuthProvider, IsActive, IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import bcryptjs from 'bcryptjs';
import {
  createAccessTokenWithRefresh,
  createUserTokens,
} from '../../utils/createTokens';
import { envVars } from '../../config/env';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sendEmail } from '../../utils/sendMail';
import { name } from 'ejs';




const getNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.NOT_FOUND, 'no RefreshToken Received');
  }

  const accessToken = await createAccessTokenWithRefresh(refreshToken);
  return {
    accessToken: accessToken,
  };
};



const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedUser: JwtPayload
) => {
  const user = await User.findById(decodedUser.userId);

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User Not Found');
  }

  if (user.isDeleted && user.isActive === IsActive.BLOCKED) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is Blocked or Deleted');
  }

  const isOldPassword = await bcryptjs.compare(
    oldPassword,
    user?.password as string
  );

  if (!isOldPassword) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Old Password does not match');
  }

  user!.password = await bcryptjs.hash(newPassword, envVars.BCRYPT_SALT_ROUND);

  user!.save();
};


const setPassword = async ( password: string, decodedUser: JwtPayload) => {
  const user = await User.findById(decodedUser.userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.password && user.auths[0].provider !== 'Email') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'User already has a password'
    );
  }

  const hashPassword = await bcryptjs.hash(
    password,
    envVars.BCRYPT_SALT_ROUND
  );

  const credentialProvider: IAuthProvider = {
    provider: 'email',
    providerId: user.email,
  };
  
  const auths: IAuthProvider[] = [...user.auths, credentialProvider];
  user.password = hashPassword;
  user.isActive = IsActive.ACTIVE;
  user.auths = auths;

  await user.save();
  return {
    user: user.toObject(),
  };
};


const forgotPassword = async (email: string) => {
   const isUserExist = await User.findOne({ email });

   if (!isUserExist) {
     throw new AppError(StatusCodes.BAD_REQUEST, 'User does not exist');
  }
  if (!isUserExist.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is not verified');
  }
  if (
    isUserExist.isActive === IsActive.BLOCKED ||
    isUserExist.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `User is ${isUserExist.isActive}`
    );
  }
  if (isUserExist.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is deleted');
  }

  const JwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const resetToken = jwt.sign(JwtPayload, envVars.JWT_ACCESS_SECRET, { expiresIn: "10m" })
  
  const sendingLink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`
 

  sendEmail({
    to: isUserExist.email,
    subject: "Password Reset Request",
    templateName: "forgetPassword",
    templateData: {
      name: isUserExist.name,
      sendingLink: sendingLink
    }
  })

}


const resetPassword = async (payload : Record<string, any> , decodedUser: JwtPayload) => {
  
  if (payload.id != decodedUser.userId) {
    throw new AppError(401, 'You can not reset your password');
  }

  const isUserExist = await User.findById(decodedUser.userId);

  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User Dose not Exist")
  }


  const isHashPassword = await bcryptjs.hash(payload.newPassword, envVars.BCRYPT_SALT_ROUND)
  
  isUserExist.password = isHashPassword;
  isUserExist.isActive = IsActive.ACTIVE;

  await isUserExist.save()

}

export const authServices = {
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
};
