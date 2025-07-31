import bcryptjs from 'bcryptjs';
import { User } from '../modules/user/user.model';
import { envVars } from '../config/env';
import { IAuthProvider, IUser, Role } from '../modules/user/user.interface';

export const createAdmin = async () => {
  try {
    const isAdminExist = await User.findOne({
      email: envVars.ADMIN_EMAIL,
    });

    if (isAdminExist) {
      console.log('Admin Already Exists!');
      return;
    }

    const isHashPassword = await bcryptjs.hash(
      envVars.ADMIN_PASSWORD,
      envVars.BCRYPT_SALT_ROUND
    );

    const authProvider: IAuthProvider = {
      provider: 'Email',
      providerId: envVars.ADMIN_EMAIL,
    };
    const payload  = {
      name: envVars.ADMIN_NAME,
      role: Role.ADMIN,
      email: envVars.ADMIN_EMAIL,
      address: 'Dhaka',
      phone: '+8801791732611',
      password: isHashPassword,
      isVerified: true,
      auths: [authProvider],
    };

   await User.create(payload);

  } catch (error) {
    console.log(error);
  }
};
