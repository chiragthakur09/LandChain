import { Module } from '@nestjs/common';
import { FabricService } from './fabric/fabric.service';
import { LandController } from './land/land.controller';
import { IdentityModule } from './identity/identity.module';

@Module({
    imports: [IdentityModule],
    controllers: [LandController],
    providers: [FabricService],
})
export class AppModule { }
