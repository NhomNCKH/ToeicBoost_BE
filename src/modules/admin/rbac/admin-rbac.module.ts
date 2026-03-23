import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminInvite } from './entities/admin-invite.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRoleAssignment } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { AdminRbacService } from './admin-rbac.service';
import { AdminRbacController } from './admin-rbac.controller';
import { User } from '@modules/security/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminInvite,
      Role,
      Permission,
      UserRoleAssignment,
      RolePermission,
      User,
    ]),
  ],
  controllers: [AdminRbacController],
  providers: [AdminRbacService],
  exports: [TypeOrmModule, AdminRbacService],
})
export class AdminRbacModule {}
