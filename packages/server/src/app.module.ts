import { Module } from '@nestjs/common';
import { FabricService } from './fabric/fabric.service';
import { LandController } from './land/land.controller';
import { LandService } from './land/land.service';
import { IdentityModule } from './identity/identity.module';
import { IpfsService } from './common/services/ipfs.service';
import { IpfsController } from './common/controllers/ipfs.controller';

@Module({
    imports: [IdentityModule],
    controllers: [LandController, IpfsController],
    providers: [FabricService, IpfsService, LandService],
})
export class AppModule { }
