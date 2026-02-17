import { Module } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: 'LANDCHAIN_SECRET_KEY_DEV',
            signOptions: { expiresIn: '60m' },
        }),
    ],
    controllers: [IdentityController],
    providers: [IdentityService, JwtStrategy],
    exports: [IdentityService],
})
export class IdentityModule { }
