
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'LANDCHAIN_SECRET_KEY_DEV', // In proper env, use ConfigService
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, aadhaar: payload.aadhaar, role: payload.role };
    }
}
