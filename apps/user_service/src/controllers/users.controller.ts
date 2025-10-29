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
  Path,
  BodyProp,
} from 'tsoa';
import {
  getUserById,
  updateUser,
  deleteUser,
} from '../services/user.service';
import { User } from '../models/user.model';

@Route('v1/users')
@Tags('Users')
@Security('jwt')
export class UsersController extends Controller {
  // Self-service endpoint for the authenticated user
  @Get('me')
  public async getCurrentUser(@Request() req: { user: User }) {
    return req.user;
  }
  
  // Self-service endpoint to update own profile
  @Patch('me')
  public async updateCurrentUser(
    @Request() req: { user: User },
    @BodyProp() username?: string,
    @BodyProp() display_name?: string,
    @BodyProp() description?: string,
    @BodyProp() programming_proficiency?: 'beginner' | 'intermediate' | 'advanced',
    @BodyProp() preferred_language?: 'cpp' | 'java' | 'python' | 'javascript',
    @BodyProp() avatar_url?: string
  ) {
    const user = await updateUser(req.user.id, {
      username,
      display_name,
      description,
      programming_proficiency,
      preferred_language,
      avatar_url,
    });
    if (!user) {
      this.setStatus(404);
      return;
    }
    return user;
  }

  // Self-service endpoint to delete own profile
  @Delete('me')
  public async deleteCurrentUser(@Request() req: { user: User }) {
    const user = await deleteUser(req.user.id);
    if (!user) {
      this.setStatus(404);
      return;
    }
    return { message: 'User deleted' };
  }

  // Administrative Endpoint to get any user
  @Get('{userId}')
  @Security('jwt', ['users:read'])
  public async getUser(@Path() userId: string) {
    const user = await getUserById(userId);
    if (!user) {
      this.setStatus(404);
      return;
    }
    return user;
  }

  // Administrative endpoint to update any user
  @Patch('{userId}')
  @Security('jwt', ['admin:users:edit'])
  public async updateUserById(
    @Path() userId: string,
    @BodyProp() username?: string,
    @BodyProp() display_name?: string,
    @BodyProp() description?: string,
    @BodyProp() programming_proficiency?: 'beginner' | 'intermediate' | 'advanced',
    @BodyProp() preferred_language?: 'cpp' | 'java' | 'python' | 'javascript',
  ) {
    const user = await updateUser(userId, {
      username,
      display_name,
      description,
      programming_proficiency,
      preferred_language,
    });
    if (!user) {
      this.setStatus(404);
      return;
    }
    return user;
  }

  // Administrative endpoint to delete any user
  @Delete('{userId}')
  @Security('jwt', ['admin:users:delete'])
  public async deleteUserById(@Path() userId: string) {
    const user = await deleteUser(userId);
    if (!user) {
      this.setStatus(404);
      return;
    }
    return { message: 'User deleted successfully' };
  }
}
