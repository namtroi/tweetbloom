import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SummarizeChatToNoteSchema, SummarizeChatToNoteResponseSchema, NoteRowSchema } from '@tweetbloom/types';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';
import { BloomBuddyService } from '../../services/ai/bloom-buddy';
import { RATE_LIMITS } from '../../config/rate-limits';

const summarizeRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/summarize', {
        preHandler: [authMiddleware],
        config: {
            rateLimit: {
                max: RATE_LIMITS.summarize.max,
                timeWindow: RATE_LIMITS.summarize.timeWindow
            }
        },
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
            // @ts-expect-error - Supabase generated types don't properly infer insert return types. We validate with NoteRowSchema below.
            .insert({
                user_id: user.id,
                content: summary,
            })
            .select()
            .single();

        if (noteError || !newNote) {
            req.log.error(noteError, 'Failed to save note');
            throw new Error('Failed to save note');
        }
        
        // Validate note data
        const validatedNote = NoteRowSchema.parse(newNote);

        return {
            noteId: validatedNote.id,
            content: summary
        };
    });
};

export default summarizeRoutes;
