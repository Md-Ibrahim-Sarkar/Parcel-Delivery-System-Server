import { NextFunction, Request, Response, Router } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";
import { Parcel } from "../parcel/parcel.model";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { statsController } from "./stats.controller";



const router = Router()

router.get('/parcel-stats', checkAuth(Role.ADMIN) , statsController.getParcelsStats)
router.get('/user-stats', checkAuth(Role.ADMIN) , statsController.getUsersStats)


export const statsRoute = router;