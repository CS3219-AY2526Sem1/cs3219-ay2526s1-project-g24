
import { UsersController } from '../users.controller';
import { getUserById, updateUser, deleteUser } from '../../services/user.service';

jest.mock('../../services/user.service');

describe('UsersController', () => {
  let usersController: UsersController;

  beforeEach(() => {
    usersController = new UsersController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      const req = { user: { id: 'user_id', email: 'test@example.com' } } as any;

      const result = await usersController.getCurrentUser(req);

      expect(result).toEqual(req.user);
    });
  });

  describe('updateCurrentUser', () => {
    it('should update the current user', async () => {
      const req = { user: { id: 'user_id' } } as any;
      const displayName = 'Test User';
      const user = { id: 'user_id', display_name: displayName };

      (updateUser as jest.Mock).mockResolvedValue(user);

      const result = await usersController.updateCurrentUser(req, undefined, displayName);

      expect(updateUser).toHaveBeenCalledWith('user_id', { 
        username: undefined,
        display_name: displayName,
        description: undefined,
        programming_proficiency: undefined,
        avatar_url: undefined,
      });
      expect(result).toEqual(user);
    });
  });

  describe('deleteCurrentUser', () => {
    it('should delete the current user', async () => {
      const req = { user: { id: 'user_id' } } as any;

      (deleteUser as jest.Mock).mockResolvedValue({ id: 'user_id' } as any);

      const result = await usersController.deleteCurrentUser(req);

      expect(deleteUser).toHaveBeenCalledWith('user_id');
      expect(result).toEqual({ message: 'User deleted' });
    });
  });
});
