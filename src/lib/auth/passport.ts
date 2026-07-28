import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { getDataSource, ProfileEntity } from '@/lib/db/postgres';
import { comparePassword } from './password';

const JWT_SECRET = process.env.JWT_SECRET || 'tribu-dulce-secret-key-fallback-2026';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const ds = await getDataSource();
        const profileRepo = ds.getRepository(ProfileEntity);
        const user = await profileRepo.findOne({ where: { email } });

        if (!user) {
          return done(null, false, { message: 'Usuario no encontrado o credenciales incorrectas' });
        }

        const isMatch = await comparePassword(password, user.password_hash);
        if (!isMatch) {
          return done(null, false, { message: 'Usuario no encontrado o credenciales incorrectas' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (jwtPayload, done) => {
      try {
        const ds = await getDataSource();
        const profileRepo = ds.getRepository(ProfileEntity);
        const user = await profileRepo.findOne({ where: { id: jwtPayload.id } });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
