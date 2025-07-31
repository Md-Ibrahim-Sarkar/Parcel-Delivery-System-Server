import { Router } from 'express';
import { userRoute } from '../modules/user/user.route';
import { authRoute } from '../modules/auth/auth.route';
import { parcelRoute } from '../modules/parcel/parcel.route';

export const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: userRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/parcel',
    route: parcelRoute,
  },
];

moduleRoutes.forEach(route => {
  router.use(route.path, route.route);
});
