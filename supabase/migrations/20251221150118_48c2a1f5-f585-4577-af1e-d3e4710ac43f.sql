-- Performance indexes for common query patterns

-- Index for fetching pending tasks by aquarium (used in dashboard, task lists)
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_aquarium_status 
ON public.maintenance_tasks (aquarium_id, status);

-- Index for fetching water tests by user ordered by date (used in history, analytics)
CREATE INDEX IF NOT EXISTS idx_water_tests_user_created 
ON public.water_tests (user_id, created_at DESC);

-- Index for fetching water tests by aquarium ordered by test date (used in charts, latest test)
CREATE INDEX IF NOT EXISTS idx_water_tests_aquarium_date 
ON public.water_tests (aquarium_id, test_date DESC);

-- Index for chat messages by conversation ordered by creation (used in chat view)
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created 
ON public.chat_messages (conversation_id, created_at ASC);

-- Index for test parameters by test (used when fetching test with parameters)
CREATE INDEX IF NOT EXISTS idx_test_parameters_test 
ON public.test_parameters (test_id);

-- Index for maintenance tasks by due date for calendar view
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_due_date 
ON public.maintenance_tasks (due_date, status);