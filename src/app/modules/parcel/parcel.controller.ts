import { NextFunction, Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync"
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { parcelServies } from "./parcel.service";
import { JwtPayload } from "jsonwebtoken";
import { Parcel } from "./parcel.model";
import AppError from "../../errorHelpers/AppError";





const createParcel = catchAsync(async (req: Request, res: Response, next: NextFunction) => { 

  const decodedUser = req.user;

  const parcel  = await parcelServies.createParcel(req.body, decodedUser as JwtPayload)


  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Parcel created Successfully!",
    data: parcel
   })

})


const updateParcel = catchAsync(async (req: Request, res: Response, next: NextFunction) => { 

  const decodedUser = req.user;

  const updatedParcel  = await parcelServies.updateParcel(req.params.id,req.body, decodedUser as JwtPayload)


  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Parcel Updated Successfully!',
    data: updatedParcel,
  });

})




const cancelParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const parcelId = req.params.id;

    await parcelServies.cancelParcel(
      parcelId,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Parcel canceled Successfully!',
      data: null,
    });
  }
);


const getAllParcels = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const query = req.query;
    const allParcels = await parcelServies.getAllParcels(
      decodedUser as JwtPayload,
      query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Parcels received successfully!',
      data: allParcels,
    });
  }
);

const getAParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

    const Parcel = await parcelServies.getAParcel(
      req.params.id,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Parcels received successfully!',
      data: Parcel,
    });
  }
);

// for Receivers
const receiverIncomingParcels = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;
    const query = req.query
    const IncomingParcels = await parcelServies.receiverIncomingParcels(
      decodedUser as JwtPayload,
      query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Incoming Parcels received Successfully!',
      data: IncomingParcels,
    });
  }
);


const confirmDelivery = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

    const data = await parcelServies.confirmDelivery(req.params.id,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Parcel Confirm Successfully!',
      data: null,
    });
  }
);



const getDeliveryHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

   const deliveryHistory =  await parcelServies.getDeliveryHistory(decodedUser as JwtPayload, req.query as Record<string, string>);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Delivery History received Successfully!',
      data: deliveryHistory,
    });
  }
);



const updateParcelStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

    const updatedParcelStatus = await parcelServies.updateParcelStatus(
      req.params.id,
      req.body,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Parcel Updated Successfully!',
      data: updatedParcelStatus,
    });
  }
);

const trackParcelWithTrackingId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const tracId = req.params.trackingId;
    const matchtodatabase = await Parcel.findOne({trackingId: tracId});
    if(!matchtodatabase){
      throw new AppError(StatusCodes.NOT_FOUND, 'No parcel found with this tracking ID');
    }
    const parcel = await Parcel.findOne({
      trackingId: req.params.trackingId,
    })
      .select('-trackingId -isDeleted')
      .populate('senderId', 'name email phone -_id')
      .populate('statusHistory.updatedBy', 'role -_id');

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Parcel received Successfully!',
      data: parcel,
    });
  }
);

const deleteParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    
    const decodedUser = req.user;

    await parcelServies.deleteParcel(req.params.id, decodedUser as JwtPayload )

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Parcel Delete Successfully!',
      data: null,
    });
  }
);






export const parcelController = {
  createParcel,
  updateParcel,
  cancelParcel,
  getAllParcels,
  getAParcel,
  receiverIncomingParcels,
  confirmDelivery,
  getDeliveryHistory,
  updateParcelStatus,
  trackParcelWithTrackingId,
  deleteParcel,
};