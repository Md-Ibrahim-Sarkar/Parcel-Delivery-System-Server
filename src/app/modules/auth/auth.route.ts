import { NextFunction, Request, Response, Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import passport from "passport";





const router = Router()


router.post('/login', AuthController.userLogin)

router.post('/refresh-token', AuthController.getNewAccessToken)

router.post('/logout', checkAuth(...Object.values(Role)), AuthController.logout)

router.post('/change-password', checkAuth(...Object.values(Role)), AuthController.changePassword)

router.post('/set-password', checkAuth(...Object.values(Role)), AuthController.setPassword);


router.post('/forgot-password', checkAuth(...Object.values(Role)), AuthController.forgotPassword)

router.post('/reset-password', checkAuth(...Object.values(Role)), AuthController.resetPassword);

router.get('/me', checkAuth(...Object.values(Role)), AuthController.gatMe);


// google auth routes
router.get('/google', async (req: Request, res: Response, next: NextFunction) => {
  const redirect = req.query.redirect || '/'
  passport.authenticate("google", {scope: ["profile","email"],state: redirect as string })(req, res,next)
})
router.get("/google/callback", passport.authenticate("google", {failureRedirect: "/login"}), AuthController.googleCallbackController)



export const authRoute = router