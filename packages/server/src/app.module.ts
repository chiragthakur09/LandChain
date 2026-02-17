import { Module } from '@nestjs/common';
import { FabricService } from './fabric/fabric.service';
import { LandController } from './land/land.controller';
import { IdentityModule } from './identity/identity.module';
import { IpfsService } from './common/services/ipfs.service';

@Module({
    imports: [IdentityModule],
    controllers: [LandController],
    providers: [FabricService, IpfsService],
})
export class AppModule { }
