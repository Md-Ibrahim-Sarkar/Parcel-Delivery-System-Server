import { Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";




const router = Router()

router.post('/register', validateRequest(createUserZodSchema), userController.createUser)

// for profile update any type of user
router.patch('/update-profile/:id', checkAuth(...Object.values(Role)), validateRequest(updateUserZodSchema), userController.updateUserProfile)

// for admin
router.patch('/:id', checkAuth(Role.ADMIN), validateRequest(updateUserZodSchema), userController.updateUser);
router.get('/all-users', checkAuth(Role.ADMIN), userController.getAllUsers)

export const  userRoute = router