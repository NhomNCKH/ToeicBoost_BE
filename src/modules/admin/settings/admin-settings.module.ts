import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { FeatureFlag } from './entities/feature-flag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting, FeatureFlag])],
  exports: [TypeOrmModule],
})
export class AdminSettingsModule {}
