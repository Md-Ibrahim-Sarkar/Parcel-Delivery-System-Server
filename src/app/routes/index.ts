import { Router } from 'express';
import { userRoute } from '../modules/user/user.route';
import { authRoute } from '../modules/auth/auth.route';
import { parcelRoute } from '../modules/parcel/parcel.route';
import { contactRoute } from '../modules/contact/contact.route';
import { statsRoute } from '../modules/stats/stats.route';

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
    path: '/parcels',
    route: parcelRoute,
  },
  {
    path: '/contact',
    route: contactRoute,
  },
  {
    path: '/stats',
    route: statsRoute,
  },
];

moduleRoutes.forEach(route => {
  router.use(route.path, route.route);
});
