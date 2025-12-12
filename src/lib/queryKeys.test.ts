import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys factory', () => {
  describe('aquariums', () => {
    it('should have base key', () => {
      expect(queryKeys.aquariums.all).toEqual(['aquariums']);
    });

    it('should generate list key with userId', () => {
      expect(queryKeys.aquariums.list('user123')).toEqual(['aquariums', 'list', 'user123']);
    });

    it('should generate detail key with id', () => {
      expect(queryKeys.aquariums.detail('aq123')).toEqual(['aquariums', 'detail', 'aq123']);
    });

    it('should generate withTasks key', () => {
      expect(queryKeys.aquariums.withTasks('aq123')).toEqual(['aquariums', 'detail', 'aq123', 'tasks']);
    });

    it('should generate withEquipment key', () => {
      expect(queryKeys.aquariums.withEquipment('aq123')).toEqual(['aquariums', 'detail', 'aq123', 'equipment']);
    });
  });

  describe('waterTests', () => {
    it('should have base key', () => {
      expect(queryKeys.waterTests.all).toEqual(['water-tests']);
    });

    it('should generate list key with aquariumId', () => {
      expect(queryKeys.waterTests.list('aq123')).toEqual(['water-tests', 'list', 'aq123']);
    });

    it('should generate latest key with aquariumId', () => {
      expect(queryKeys.waterTests.latest('aq123')).toEqual(['water-tests', 'latest', 'aq123']);
    });

    it('should generate charts key with aquariumId and dateRange', () => {
      expect(queryKeys.waterTests.charts('aq123', '30d')).toEqual(['water-tests', 'charts', 'aq123', '30d']);
    });

    it('should generate detail key with id', () => {
      expect(queryKeys.waterTests.detail('wt123')).toEqual(['water-tests', 'detail', 'wt123']);
    });

    it('should generate templates key', () => {
      expect(queryKeys.waterTests.templates('freshwater', 'user123')).toEqual(['all-templates', 'freshwater', 'user123']);
    });

    it('should generate monthlyCount key', () => {
      expect(queryKeys.waterTests.monthlyCount('user123')).toEqual(['water-tests', 'monthly-count', 'user123']);
    });
  });

  describe('tasks', () => {
    it('should have base key', () => {
      expect(queryKeys.tasks.all).toEqual(['maintenance-tasks']);
    });

    it('should generate list key with aquariumId', () => {
      expect(queryKeys.tasks.list('aq123')).toEqual(['maintenance-tasks', 'list', 'aq123']);
    });

    it('should generate calendar key with month', () => {
      expect(queryKeys.tasks.calendar('2025-06')).toEqual(['maintenance-tasks', 'calendar', '2025-06']);
    });

    it('should generate upcomingForAquarium key with aquariumId', () => {
      expect(queryKeys.tasks.upcomingForAquarium('aq123')).toEqual(['maintenance-tasks', 'upcoming', 'aq123']);
    });

    it('should generate detail key with id', () => {
      expect(queryKeys.tasks.detail('task123')).toEqual(['maintenance-tasks', 'detail', 'task123']);
    });

    it('should have dashboardCount key', () => {
      expect(queryKeys.tasks.dashboardCount).toEqual(['maintenance-tasks', 'dashboard-count']);
    });
  });

  describe('equipment', () => {
    it('should have base key', () => {
      expect(queryKeys.equipment.all).toEqual(['equipment']);
    });

    it('should generate list key with aquariumId', () => {
      expect(queryKeys.equipment.list('aq123')).toEqual(['equipment', 'list', 'aq123']);
    });

    it('should generate count key with aquariumId', () => {
      expect(queryKeys.equipment.count('aq123')).toEqual(['equipment', 'count', 'aq123']);
    });

    it('should generate detail key with id', () => {
      expect(queryKeys.equipment.detail('eq123')).toEqual(['equipment', 'detail', 'eq123']);
    });
  });

  describe('livestock', () => {
    it('should have base key', () => {
      expect(queryKeys.livestock.all).toEqual(['livestock']);
    });

    it('should generate list key with aquariumId', () => {
      expect(queryKeys.livestock.list('aq123')).toEqual(['livestock', 'list', 'aq123']);
    });

    it('should generate detail key with id', () => {
      expect(queryKeys.livestock.detail('ls123')).toEqual(['livestock', 'detail', 'ls123']);
    });
  });

  describe('plants', () => {
    it('should have base key', () => {
      expect(queryKeys.plants.all).toEqual(['plants']);
    });

    it('should generate list key with aquariumId', () => {
      expect(queryKeys.plants.list('aq123')).toEqual(['plants', 'list', 'aq123']);
    });

    it('should generate detail key with id', () => {
      expect(queryKeys.plants.detail('pl123')).toEqual(['plants', 'detail', 'pl123']);
    });
  });

  describe('chat', () => {
    it('should have base key', () => {
      expect(queryKeys.chat.all).toEqual(['chat']);
    });

    it('should generate conversations key with userId', () => {
      expect(queryKeys.chat.conversations('user123')).toEqual(['chat', 'conversations', 'user123']);
    });

    it('should generate messages key with conversationId', () => {
      expect(queryKeys.chat.messages('conv123')).toEqual(['chat', 'messages', 'conv123']);
    });

    it('should generate conversation key with id', () => {
      expect(queryKeys.chat.conversation('conv123')).toEqual(['chat', 'conversation', 'conv123']);
    });
  });

  describe('user', () => {
    it('should generate profile key with userId', () => {
      expect(queryKeys.user.profile('user123')).toEqual(['user', 'profile', 'user123']);
    });

    it('should generate roles key with userId', () => {
      expect(queryKeys.user.roles('user123')).toEqual(['user', 'roles', 'user123']);
    });

    it('should generate notifications key with userId', () => {
      expect(queryKeys.user.notifications('user123')).toEqual(['user', 'notifications', 'user123']);
    });

    it('should generate memories key with userId', () => {
      expect(queryKeys.user.memories('user123')).toEqual(['user', 'memories', 'user123']);
    });
  });

  describe('admin', () => {
    it('should have users key', () => {
      expect(queryKeys.admin.users).toEqual(['admin', 'users']);
    });

    it('should generate userDetail key with id', () => {
      expect(queryKeys.admin.userDetail('user123')).toEqual(['admin', 'users', 'user123']);
    });

    it('should have waitlist key', () => {
      expect(queryKeys.admin.waitlist).toEqual(['admin', 'waitlist']);
    });

    it('should have tickets key', () => {
      expect(queryKeys.admin.tickets).toEqual(['admin', 'tickets']);
    });

    it('should generate ticketDetail key with id', () => {
      expect(queryKeys.admin.ticketDetail('ticket123')).toEqual(['admin', 'tickets', 'ticket123']);
    });

    it('should have announcements key', () => {
      expect(queryKeys.admin.announcements).toEqual(['admin', 'announcements']);
    });

    it('should have blogPosts key', () => {
      expect(queryKeys.admin.blogPosts).toEqual(['admin', 'blog-posts']);
    });

    it('should generate blogPost key with id', () => {
      expect(queryKeys.admin.blogPost('post123')).toEqual(['admin', 'blog-posts', 'post123']);
    });

    it('should generate activityLogs key with userId', () => {
      expect(queryKeys.admin.activityLogs('user123')).toEqual(['admin', 'activity-logs', 'user123']);
    });
  });

  describe('blog', () => {
    it('should have posts key', () => {
      expect(queryKeys.blog.posts).toEqual(['blog', 'posts']);
    });

    it('should generate post key with slug', () => {
      expect(queryKeys.blog.post('my-post-slug')).toEqual(['blog', 'posts', 'my-post-slug']);
    });

    it('should have categories key', () => {
      expect(queryKeys.blog.categories).toEqual(['blog', 'categories']);
    });
  });
});
