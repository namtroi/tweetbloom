import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SummarizeNotesSchema, SummarizeNotesResponseSchema } from '@tweetbloom/types';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';
import { BloomBuddyService } from '../../services/ai/bloom-buddy';

const combineRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/combine', {
        preHandler: [authMiddleware],
        schema: {
            body: SummarizeNotesSchema,
            response: {
                200: SummarizeNotesResponseSchema
            }
        }
    }, async (req, reply) => {
        const { noteIds } = req.body;
        const user = req.user!;
        const supabase = createUserClient(req.jwt!);

        // 1. Fetch Notes
        const { data: notes, error: notesError } = await supabase
            .from('notes')
            .select('content')
            .in('id', noteIds)
            .eq('user_id', user.id); // Ensure user owns the notes

        if (notesError || !notes || notes.length < 2) {
            req.log.error(notesError, 'Failed to fetch notes or not enough notes found');
            throw new Error('Failed to fetch notes or not enough notes found');
        }

        // 2. Call Bloom Buddy to Combine
        const noteContents = (notes as any[]).map(n => n.content);
        const combinedContent = await BloomBuddyService.getInstance().combineNotes(noteContents);

        // 3. Save Combined Note
        const { data: newNote, error: saveError } = await supabase
            .from('notes')
            // @ts-ignore
            .insert({
                user_id: user.id,
                content: combinedContent,
                // Optional: link to parent notes if schema supported it, but for now just content
            })
            .select()
            .single();

        if (saveError || !newNote) {
            req.log.error(saveError, 'Failed to save combined note');
            throw new Error('Failed to save combined note');
        }

        return {
            noteId: (newNote as any).id,
            content: (newNote as any).content
        };
    });
};

export default combineRoutes;
