import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { parcelController } from "./parcel.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createParcelZodSchema, updateParcelStatusZodSchema, updateParcelZodSchema } from "./parcel.validation";





const router = Router()

// only for Senders
router.post('/create', checkAuth(...Object.values(Role)), validateRequest(createParcelZodSchema), parcelController.createParcel);


// for senders , receivers, admin
router.get('/get-parcel/:id', checkAuth(...Object.values(Role)), parcelController.getAParcel)

// for senders , receivers, admin
router.get('/', checkAuth(...Object.values(Role)), parcelController.getAllParcels)

// only for receivers
router.get('/incoming-parcels', checkAuth(Role.RECEIVER), parcelController.receiverIncomingParcels);

// for senders , receivers, admin
router.get('/get-delivery-history', checkAuth(...Object.values(Role)), parcelController.getDeliveryHistory);

// ONLY FOR RECEIVERS
router.patch('/confirm-delivery/:id', checkAuth(Role.RECEIVER), parcelController.confirmDelivery);

// only for Senders
router.patch('/update/:id', checkAuth(Role.SENDER), validateRequest(updateParcelZodSchema), parcelController.updateParcel)

// only for senders
router.patch('/cancel/:id', checkAuth(...Object.values(Role)), parcelController.cancelParcel);

// only for admin
router.patch('/update-parcel-status/:id', checkAuth(Role.ADMIN), validateRequest(updateParcelStatusZodSchema), parcelController.updateParcelStatus)

// delete parcel
router.patch('/delete/:id', checkAuth(Role.ADMIN, Role.SENDER), parcelController.deleteParcel)

// parcel track with trackingId
router.get('/track/:trackingId', parcelController.trackParcelWithTrackingId);

export const parcelRoute = router