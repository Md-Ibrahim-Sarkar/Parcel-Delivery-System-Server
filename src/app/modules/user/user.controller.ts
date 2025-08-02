/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { userServices } from './user.service';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await userServices.createUser(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'User Created Successfuly!',
      data: user,
    });
  }
);

const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const payload = req.body;
    const decodedToken = req.user;
    const user = await userServices.updateUser(
      userId,
      payload,
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User Updated Successfully!',
      data: user,
    });
  }
);

const updateUserProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const payload = req.body;
    const decodedToken = req.user;
    const user = await userServices.updateUserProfile(
      userId,
      payload,
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User Updated Successfully!',
      data: user,
    });
  }
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;
    const query = req.query;

    const result = await userServices.getAllUser(
      decodedToken as JwtPayload,
      query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'All Users Retrieved Successfully',
      meta: result.meta,
      data: result.data,
    });
  }
);

export const userController = {
  createUser,
  getAllUsers,
  updateUser,
  updateUserProfile,
};
