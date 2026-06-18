-- Chat: allow public read + realtime, but block direct anon inserts (post via /api/chat/message only).

drop policy if exists chat_messages_insert_all on public.chat_messages;
