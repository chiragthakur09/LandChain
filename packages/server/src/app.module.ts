import { Module } from '@nestjs/common';
import { FabricService } from './fabric/fabric.service';
import { LandController } from './land/land.controller';

@Module({
    imports: [],
    controllers: [LandController],
    providers: [FabricService],
})
export class AppModule { }
