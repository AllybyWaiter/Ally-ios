-- Enable realtime for profiles table so admin panel gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;