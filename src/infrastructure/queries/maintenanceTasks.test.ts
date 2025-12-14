import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMaintenanceTask } from './maintenanceTasks';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('maintenanceTasks DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock auth.getSession for ensureFreshSession
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);
  });

  describe('createMaintenanceTask', () => {
    it('should create task with required fields', async () => {
      const mockTask = {
        id: 'task-1',
        aquarium_id: 'aquarium-1',
        task_name: 'Water Change',
        task_type: 'water_change',
        due_date: '2025-01-15',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createMaintenanceTask({
        aquarium_id: 'aquarium-1',
        task_name: 'Water Change',
        task_type: 'water_change',
        due_date: '2025-01-15',
      });

      expect(supabase.from).toHaveBeenCalledWith('maintenance_tasks');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        aquarium_id: 'aquarium-1',
        task_name: 'Water Change',
        task_type: 'water_change',
        due_date: '2025-01-15',
        status: 'pending',
      }));
      expect(result).toEqual(mockTask);
    });

    it('should create task with optional fields', async () => {
      const mockTask = {
        id: 'task-1',
        aquarium_id: 'aquarium-1',
        task_name: 'Filter Cleaning',
        task_type: 'filter_cleaning',
        due_date: '2025-01-15',
        status: 'pending',
        notes: 'Replace carbon',
        is_recurring: true,
        recurrence_interval: 'weekly',
        equipment_id: 'equipment-1',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      const result = await createMaintenanceTask({
        aquarium_id: 'aquarium-1',
        task_name: 'Filter Cleaning',
        task_type: 'filter_cleaning',
        due_date: '2025-01-15',
        notes: 'Replace carbon',
        is_recurring: true,
        recurrence_interval: 'weekly',
        equipment_id: 'equipment-1',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        notes: 'Replace carbon',
        is_recurring: true,
        recurrence_interval: 'weekly',
        equipment_id: 'equipment-1',
      }));
      expect(result).toEqual(mockTask);
    });

    it('should use provided status instead of default', async () => {
      const mockTask = { id: 'task-1', status: 'completed' };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createMaintenanceTask({
        aquarium_id: 'aquarium-1',
        task_name: 'Water Change',
        task_type: 'water_change',
        due_date: '2025-01-15',
        status: 'completed',
      });

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed',
      }));
    });

    it('should throw error on failure', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await expect(createMaintenanceTask({
        aquarium_id: 'aquarium-1',
        task_name: 'Water Change',
        task_type: 'water_change',
        due_date: '2025-01-15',
      })).rejects.toEqual({ message: 'Insert failed' });
    });

    it('should call ensureFreshSession before insert', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'task-1' }, error: null }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

      await createMaintenanceTask({
        aquarium_id: 'aquarium-1',
        task_name: 'Water Change',
        task_type: 'water_change',
        due_date: '2025-01-15',
      });

      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
  });
});
