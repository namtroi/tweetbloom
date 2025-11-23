import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SummarizeChatToNoteSchema, SummarizeChatToNoteResponseSchema } from '@tweetbloom/types';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';
import { BloomBuddyService } from '../../services/ai/bloom-buddy';

const summarizeRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/summarize', {
        preHandler: [authMiddleware],
        schema: {
            body: SummarizeChatToNoteSchema,
            response: {
                200: SummarizeChatToNoteResponseSchema
            }
        }
    }, async (req, reply) => {
        const { chatId } = req.body;
        const user = req.user!;
        const supabase = createUserClient(req.jwt!);

        // 1. Fetch Chat History
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('role, content')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (msgError || !messages || messages.length === 0) {
            req.log.error(msgError, 'Failed to fetch messages or chat empty');
            throw new Error('Failed to fetch messages or chat is empty');
        }

        // 2. Call Bloom Buddy to Summarize
        const history = messages as { role: string; content: string }[];
        const summary = await BloomBuddyService.getInstance().summarizeChat(history);

        // 3. Save Summary to Notes
        const { data: newNote, error: noteError } = await supabase
            .from('notes')
            // @ts-ignore
            .insert({
                user_id: user.id,
                content: summary,
                // We don't have a direct chat_id link in notes table based on schema provided earlier, 
                // but if we did, we'd add it here. For now, just content.
                // Assuming schema: id, user_id, content, parent_id, created_at...
            })
            .select()
            .single();

        if (noteError || !newNote) {
            req.log.error(noteError, 'Failed to save note');
            throw new Error('Failed to save note');
        }

        return {
            noteId: (newNote as any).id,
            content: (newNote as any).content
        };
    });
};

export default summarizeRoutes;
