import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { SummarizeNotesSchema, SummarizeNotesResponseSchema, NoteRowSchema } from '@tweetbloom/types';
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
            .select('id, content')
            .in('id', noteIds);

        if (notesError || !notes || notes.length < 2) {
            req.log.error(notesError, 'Failed to fetch notes or not enough notes found');
            throw new Error('Failed to fetch notes or not enough notes found');
        }

        // 2. Call Bloom Buddy to Combine
        const noteContents = notes.map((n: { content: string }) => n.content);
        const combinedContent = await BloomBuddyService.getInstance().combineNotes(noteContents);

        // 3. Save Combined Note
        const { data: newNote, error: saveError } = await supabase
            .from('notes')
            // @ts-expect-error - Supabase generated types don't properly infer insert return types. We validate with NoteRowSchema below.
            .insert({
                user_id: user.id,
                content: combinedContent,
            })
            .select()
            .single();

        if (saveError || !newNote) {
            req.log.error(saveError, 'Failed to save combined note');
            throw new Error('Failed to save combined note');
        }
        
        // Validate note data
        const validatedNote = NoteRowSchema.parse(newNote);

        return {
            noteId: validatedNote.id,
            content: combinedContent
        };
    });
};

export default combineRoutes;
