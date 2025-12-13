/**
 * Query Key Factory
 * 
 * Centralized query key management for React Query.
 * Use these factory functions to ensure consistent cache invalidation.
 */

export const queryKeys = {
  // Aquariums
  aquariums: {
    all: ['aquariums'] as const,
    list: (userId: string) => ['aquariums', 'list', userId] as const,
    detail: (id: string) => ['aquariums', 'detail', id] as const,
    withTasks: (id: string) => ['aquariums', 'detail', id, 'tasks'] as const,
    withEquipment: (id: string) => ['aquariums', 'detail', id, 'equipment'] as const,
    withLivestock: (id: string) => ['aquariums', 'detail', id, 'livestock'] as const,
    withPlants: (id: string) => ['aquariums', 'detail', id, 'plants'] as const,
  },

  // Water Tests
  waterTests: {
    all: ['water-tests'] as const,
    list: (aquariumId: string) => ['water-tests', 'list', aquariumId] as const,
    detail: (id: string) => ['water-tests', 'detail', id] as const,
    parameters: (testId: string) => ['water-tests', 'parameters', testId] as const,
    templates: (aquariumType: string, userId?: string) => 
      ['all-templates', aquariumType, userId] as const,
    customTemplates: (userId: string) => ['custom-templates', userId] as const,
    monthlyCount: (userId: string) => ['water-tests', 'monthly-count', userId] as const,
    latest: (aquariumId: string) => ['water-tests', 'latest', aquariumId] as const,
    charts: (aquariumId: string, dateRange: string) => ['water-tests', 'charts', aquariumId, dateRange] as const,
    alerts: (userId: string) => ['water-tests', 'alerts', userId] as const,
    aquariumAlerts: (aquariumId: string) => ['water-tests', 'alerts', 'aquarium', aquariumId] as const,
  },

  // Maintenance Tasks
  tasks: {
    all: ['maintenance-tasks'] as const,
    list: (aquariumId: string) => ['maintenance-tasks', 'list', aquariumId] as const,
    detail: (id: string) => ['maintenance-tasks', 'detail', id] as const,
    upcoming: (aquariumIds: string[]) => ['maintenance-tasks', 'upcoming', aquariumIds] as const,
    upcomingForAquarium: (aquariumId: string) => ['maintenance-tasks', 'upcoming', aquariumId] as const,
    suggestions: (aquariumId: string) => ['maintenance-tasks', 'suggestions', aquariumId] as const,
    calendar: (month: string) => ['maintenance-tasks', 'calendar', month] as const,
    dashboardCount: ['maintenance-tasks', 'dashboard-count'] as const,
  },

  // Equipment
  equipment: {
    all: ['equipment'] as const,
    list: (aquariumId: string) => ['equipment', 'list', aquariumId] as const,
    detail: (id: string) => ['equipment', 'detail', id] as const,
    count: (aquariumId: string) => ['equipment', 'count', aquariumId] as const,
  },

  // Livestock
  livestock: {
    all: ['livestock'] as const,
    list: (aquariumId: string) => ['livestock', 'list', aquariumId] as const,
    detail: (id: string) => ['livestock', 'detail', id] as const,
  },

  // Plants
  plants: {
    all: ['plants'] as const,
    list: (aquariumId: string) => ['plants', 'list', aquariumId] as const,
    detail: (id: string) => ['plants', 'detail', id] as const,
  },

  // Chat
  chat: {
    all: ['chat'] as const,
    conversations: (userId: string) => ['chat', 'conversations', userId] as const,
    conversation: (id: string) => ['chat', 'conversation', id] as const,
    messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
  },

  // User
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    memories: (userId: string) => ['user', 'memories', userId] as const,
    notifications: (userId: string) => ['user', 'notifications', userId] as const,
    roles: (userId: string) => ['user', 'roles', userId] as const,
  },

  // Admin
  admin: {
    users: ['admin', 'users'] as const,
    userDetail: (id: string) => ['admin', 'users', id] as const,
    waitlist: ['admin', 'waitlist'] as const,
    tickets: ['admin', 'tickets'] as const,
    ticketDetail: (id: string) => ['admin', 'tickets', id] as const,
    announcements: ['admin', 'announcements'] as const,
    blogPosts: ['admin', 'blog-posts'] as const,
    blogPost: (id: string) => ['admin', 'blog-posts', id] as const,
    activityLogs: (userId?: string) => ['admin', 'activity-logs', userId] as const,
  },

  // Blog
  blog: {
    posts: ['blog', 'posts'] as const,
    post: (slug: string) => ['blog', 'posts', slug] as const,
    categories: ['blog', 'categories'] as const,
  },

  // Feature Flags
  featureFlags: {
    all: ['feature-flags'] as const,
    detail: (id: string) => ['feature-flags', 'detail', id] as const,
    byKey: (key: string) => ['feature-flags', 'key', key] as const,
    overrides: (flagId: string) => ['feature-flags', 'overrides', flagId] as const,
    userOverrides: (userId: string) => ['feature-flags', 'user-overrides', userId] as const,
  },
} as const;

// Type helpers for query key extraction
export type QueryKeys = typeof queryKeys;
