import {
  Controller,
  Get,
  Patch,
  Delete,
  Route,
  Tags,
  Security,
  Request,
  Body,
} from 'tsoa';
import {
  updateUser,
  deleteUser,
  getAllUsers,
} from '../services/user.service';
import { hasRole } from '../services/auth.service';
import { User } from '../models/user.model';

@Route('v1/users')
@Tags('Users')
@Security('jwt')
export class UsersController extends Controller {
  @Get('me')
  public async getCurrentUser(@Request() req: { user: User }) {
    return req.user;
  }

  @Patch('me')
  public async updateCurrentUser(
    @Request() req: { user: User },
    @Body() data: Partial<User>
  ) {
    const user = await updateUser(req.user.id, data);
    if (!user) {
      this.setStatus(404);
      return;
    }
    return user;
  }

  @Delete('me')
  public async deleteCurrentUser(@Request() req: { user: User }) {
    const user = await deleteUser(req.user.id);
    if (!user) {
      this.setStatus(404);
      return;
    }
    return { message: 'User deleted' };
  }

  @Get('/')
  public async getAllUsers(@Request() req: { user: User }) {
    const isAdmin = await hasRole(req.user.id, ['admin']);
    if (!isAdmin) {
      this.setStatus(403);
      return;
    }

    return getAllUsers();
  }
}