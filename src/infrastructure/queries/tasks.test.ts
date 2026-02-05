import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  fetchUpcomingTasks,
} from './tasks';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('tasks DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTasks', () => {
    it('should fetch tasks for an aquarium', async () => {
      const mockData = [
        { id: 'task-1', task_name: 'Water Change', status: 'pending' },
        { id: 'task-2', task_name: 'Filter Cleaning', status: 'pending' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchTasks('aq-1');

      expect(supabase.from).toHaveBeenCalledWith('maintenance_tasks');
      expect(mockChain.eq).toHaveBeenCalledWith('aquarium_id', 'aq-1');
      expect(mockChain.order).toHaveBeenCalledWith('due_date', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no tasks exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchTasks('aq-1');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchTasks('aq-1')).rejects.toEqual({ message: 'Fetch failed' });
    });
  });

  describe('fetchTask', () => {
    it('should fetch a single task with ownership verification', async () => {
      const mockTask = { id: 'task-1', task_name: 'Water Change', due_date: '2025-01-15', aquariums: { user_id: 'user-1' } };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchTask('task-1', 'user-1');

      expect(mockChain.select).toHaveBeenCalledWith('*, aquariums!inner(user_id)');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'task-1');
      expect(mockChain.eq).toHaveBeenCalledWith('aquariums.user_id', 'user-1');
      expect(result).toEqual({ id: 'task-1', task_name: 'Water Change', due_date: '2025-01-15' });
    });

    it('should throw error when task not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchTask('invalid-id', 'user-1')).rejects.toThrow('Task not found');
    });
  });

  describe('createTask', () => {
    it('should create task with required fields and default status', async () => {
      const mockTask = {
        id: 'task-1',
        aquarium_id: 'aq-1',
        task_name: 'Water Change',
        task_type: 'water_change',
        due_date: '2025-01-15',
        status: 'pending',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createTask({
        aquarium_id: 'aq-1',
        task_name: 'Water Change',
        task_type: 'water_change',
        due_date: '2025-01-15',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'pending',
      }));
      expect(result).toEqual(mockTask);
    });

    it('should create task with optional fields', async () => {
      const mockTask = {
        id: 'task-1',
        task_name: 'Filter Cleaning',
        notes: 'Replace carbon',
        is_recurring: true,
        recurrence_interval: 'weekly',
        equipment_id: 'eq-1',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createTask({
        aquarium_id: 'aq-1',
        task_name: 'Filter Cleaning',
        task_type: 'filter_cleaning',
        due_date: '2025-01-15',
        notes: 'Replace carbon',
        is_recurring: true,
        recurrence_interval: 'weekly',
        equipment_id: 'eq-1',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        notes: 'Replace carbon',
        is_recurring: true,
        recurrence_interval: 'weekly',
        equipment_id: 'eq-1',
      }));
    });

    it('should use provided status instead of default', async () => {
      const mockTask = { id: 'task-1', status: 'completed' };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createTask({
        aquarium_id: 'aq-1',
        task_name: 'Test',
        task_type: 'other',
        due_date: '2025-01-15',
        status: 'completed',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed',
      }));
    });
  });

  describe('updateTask', () => {
    it('should update task with ownership verification', async () => {
      const mockTask = { id: 'task-1', task_name: 'Updated Task', notes: 'New notes' };

      // Mock for ownership verification
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'task-1', aquariums: { user_id: 'user-1' } }, error: null }),
      };

      // Mock for update
      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
          }),
        }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelectChain as any;
        return { update: vi.fn().mockReturnValue(mockUpdateChain) } as any;
      });

      const result = await updateTask('task-1', 'user-1', { task_name: 'Updated Task', notes: 'New notes' });

      expect(result).toEqual(mockTask);
    });

    it('should throw error when task not found during ownership check', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(updateTask('task-1', 'user-1', { notes: 'Test' })).rejects.toThrow('Task not found');
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed with ownership verification', async () => {
      const mockTask = {
        id: 'task-1',
        status: 'completed',
        completed_date: '2025-01-15',
      };

      // Mock for ownership verification
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'task-1', aquariums: { user_id: 'user-1' } }, error: null }),
      };

      // Mock for update
      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
          }),
        }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelectChain as any;
        return { update: vi.fn().mockReturnValue(mockUpdateChain) } as any;
      });

      const result = await completeTask('task-1', 'user-1');

      expect(result).toEqual(mockTask);
    });

    it('should throw error when task not found during ownership check', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(completeTask('task-1', 'user-1')).rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete task with ownership verification', async () => {
      // Mock for ownership verification
      const mockSelectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'task-1', aquariums: { user_id: 'user-1' } }, error: null }),
      };

      // Mock for delete
      const mockDeleteChain = {
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockSelectChain as any;
        return { delete: vi.fn().mockReturnValue(mockDeleteChain) } as any;
      });

      await deleteTask('task-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('maintenance_tasks');
    });

    it('should throw error when task not found during ownership check', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(deleteTask('task-1', 'user-1')).rejects.toThrow('Task not found');
    });
  });

  describe('fetchUpcomingTasks', () => {
    it('should fetch upcoming tasks with default days ahead', async () => {
      const mockData = [
        { id: 'task-1', due_date: '2025-01-10' },
        { id: 'task-2', due_date: '2025-01-12' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await fetchUpcomingTasks(['aq-1', 'aq-2']);

      expect(mockChain.in).toHaveBeenCalledWith('aquarium_id', ['aq-1', 'aq-2']);
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
      expect(result).toEqual(mockData);
    });

    it('should fetch upcoming tasks with custom days ahead', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await fetchUpcomingTasks(['aq-1'], 14);

      expect(mockChain.lte).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await expect(fetchUpcomingTasks(['aq-1'])).rejects.toEqual({ message: 'Fetch failed' });
    });
  });
});
