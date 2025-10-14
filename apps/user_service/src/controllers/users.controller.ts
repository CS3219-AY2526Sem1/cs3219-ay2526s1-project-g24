import * as tsoa from 'tsoa';
import {
  getUserById,
  updateUser,
  deleteUser,
} from '../services/user.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { User } from '../models/user.model';

@tsoa.Route('v1/users')
@tsoa.Tags('Users')
@tsoa.Security('jwt')
export class UsersController extends tsoa.Controller {
  @tsoa.Get('me')
  public async getCurrentUser(@tsoa.Request() req: AuthenticatedRequest) {
    if (!req.userId) {
      this.setStatus(401);
      return;
    }
    const user = await getUserById(req.userId);
    if (!user) {
      this.setStatus(404);
      return;
    }
    return user;
  }

  @tsoa.Patch('me')
  public async updateCurrentUser(
    @tsoa.Request() req: AuthenticatedRequest,
    @tsoa.Body() data: Partial<User>
  ) {
    if (!req.userId) {
      this.setStatus(401);
      return;
    }
    const user = await updateUser(req.userId, data);
    if (!user) {
      this.setStatus(404);
      return;
    }
    return user;
  }

  @tsoa.Post('me/avatar:presign')
  public async getPresignedAvatarUrl() {
    // Placeholder
    return { url: 'https://s3.amazonaws.com/your-bucket/your-key' };
  }

  @tsoa.Put('me/avatar')
  public async uploadAvatar() {
    // Placeholder
    return { message: 'Avatar uploaded' };
  }

  @tsoa.Delete('me')
  public async deleteCurrentUser(@tsoa.Request() req: AuthenticatedRequest) {
    if (!req.userId) {
      this.setStatus(401);
      return;
    }
    const user = await deleteUser(req.userId);
    if (!user) {
      this.setStatus(404);
      return;
    }
    return { message: 'User deleted' };
  }
}
