import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UsersController } from '../users.controller';
import * as userService from '../../services/user.service';

vi.mock('../../services/user.service');

describe('UsersController', () => {
  let usersController: UsersController;

  beforeEach(() => {
    usersController = new UsersController();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      const req = { user: { id: 'user_id', display_name: 'Test User' } };
      const result = await usersController.getCurrentUser(req as any);
      expect(result).toEqual(req.user);
    });
  });

  describe('updateCurrentUser', () => {
    it('should update the current user', async () => {
      const req = { user: { id: 'user_id' } };
      const displayName = 'Test User';
      const user = { id: 'user_id', display_name: displayName };
      vi.spyOn(userService, 'updateUser').mockResolvedValue(user as any);
      const result = await usersController.updateCurrentUser(req as any, undefined, displayName);
      expect(userService.updateUser).toHaveBeenCalledWith('user_id', {
        username: undefined,
        display_name: displayName,
        description: undefined,
        programming_proficiency: undefined,
        avatar_url: undefined,
      });
      expect(result).toEqual(user);
    });

    it('should return 404 if user not found', async () => {
      const req = { user: { id: 'user_id' } };
      const displayName = 'Test User';
      vi.spyOn(userService, 'updateUser').mockResolvedValue(null);
      const result = await usersController.updateCurrentUser(req as any, undefined, displayName);
      expect(result).toBeUndefined();
    });
  });

  describe('deleteCurrentUser', () => {
    it('should delete the current user', async () => {
      const req = { user: { id: 'user_id' } };
      vi.spyOn(userService, 'deleteUser').mockResolvedValue({ id: 'user_id' } as any);
      const result = await usersController.deleteCurrentUser(req as any);
      expect(userService.deleteUser).toHaveBeenCalledWith('user_id');
      expect(result).toEqual({ message: 'User deleted' });
    });

    it('should return 404 if user not found', async () => {
      const req = { user: { id: 'user_id' } };
      vi.spyOn(userService, 'deleteUser').mockResolvedValue(null);
      const result = await usersController.deleteCurrentUser(req as any);
      expect(result).toBeUndefined();
    });
  });

  describe('getUser', () => {
    it('should return a user by id', async () => {
      const user = { id: 'user_id', display_name: 'Test User' };
      vi.spyOn(userService, 'getUserById').mockResolvedValue(user as any);
      const result = await usersController.getUser('user_id');
      expect(result).toEqual(user);
    });

    it('should return 404 if user not found', async () => {
      vi.spyOn(userService, 'getUserById').mockResolvedValue(null);
      const result = await usersController.getUser('user_id');
      expect(result).toBeUndefined();
    });
  });

  describe('updateUserById', () => {
    it('should update a user by id', async () => {
      const displayName = 'Test User';
      const user = { id: 'user_id', display_name: displayName };
      vi.spyOn(userService, 'updateUser').mockResolvedValue(user as any);
      const result = await usersController.updateUserById('user_id', undefined, displayName);
      expect(userService.updateUser).toHaveBeenCalledWith('user_id', {
        username: undefined,
        display_name: displayName,
        description: undefined,
        programming_proficiency: undefined,
      });
      expect(result).toEqual(user);
    });

    it('should return 404 if user not found', async () => {
      const displayName = 'Test User';
      vi.spyOn(userService, 'updateUser').mockResolvedValue(null);
      const result = await usersController.updateUserById('user_id', undefined, displayName);
      expect(result).toBeUndefined();
    });
  });

  describe('deleteUserById', () => {
    it('should delete a user by id', async () => {
      vi.spyOn(userService, 'deleteUser').mockResolvedValue({ id: 'user_id' } as any);
      const result = await usersController.deleteUserById('user_id');
      expect(userService.deleteUser).toHaveBeenCalledWith('user_id');
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should return 404 if user not found', async () => {
      vi.spyOn(userService, 'deleteUser').mockResolvedValue(null);
      const result = await usersController.deleteUserById('user_id');
      expect(result).toBeUndefined();
    });
  });
});