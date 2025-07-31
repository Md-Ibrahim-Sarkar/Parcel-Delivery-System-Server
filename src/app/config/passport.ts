import bcryptjs from 'bcryptjs';
import passport, { Profile } from 'passport'
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../modules/user/user.model';
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from 'passport-google-oauth20';
import { envVars } from './env';
import { Role } from '../modules/user/user.interface';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      try {
        const isUserExist = await User.findOne({ email });

        if (!isUserExist) {
          return done(null, false, { message: 'User Not Exist' });
        }

        const isGoogleAuth = isUserExist.auths.some(
          providerObjects => providerObjects.provider === 'google'
        );

        if (isGoogleAuth && !isUserExist.password) {
          return done(null, false, {
            message:
              'You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password.',
          });
        }

        const isHashPasswordMatch = await bcryptjs.compare(
          password,
          isUserExist.password as string
        );

        if (!isHashPasswordMatch) {
          return done(null, false, { message: 'password Dose Not Match' });
        }
        return done(null, isUserExist);
      } catch (error) {
        done(error);
      }
    }
  )
);


passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(null, false, { message: 'No Email Found' });
        }

        let user = await User.findOne({ email });

        const authDetails = {
          provider: 'Google',
          providerId: profile.id,
        };

        if (!user) {
          user = await User.create({
            email,
            name: profile.displayName,
            picture: profile.photos?.[0].value,
            role: Role.SENDER,
            isVerified: true,
            auths: [authDetails],
          });
        } else {
           const isAlreadyLinked = user.auths.some(
             auth => auth.provider === authDetails.provider
           );

           if (!isAlreadyLinked) {
             user.auths.push(authDetails);
             await user.save(); 
           }
        }


        return done(null, user);
      } catch (error) {
        console.log('Google Strategy Error:', error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
