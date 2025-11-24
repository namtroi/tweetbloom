import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth';
import { NoteService } from '../../services/note';

const crudRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    // Get all notes
    app.get('/', {
        preHandler: [authMiddleware],
    }, async (req, reply) => {
        const service = new NoteService(req.jwt!);
        const notes = await service.getNotes();
        return notes;
    });

    // Create note
    app.post('/', {
        preHandler: [authMiddleware],
        schema: {
            body: z.object({
                content: z.string().min(1).max(1200),
                parentId: z.string().uuid().optional().nullable(),
            })
        }
    }, async (req, reply) => {
        const service = new NoteService(req.jwt!);
        const note = await service.createNote(req.body);
        return reply.status(201).send(note);
    });

    // Update note
    app.patch('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            }),
            body: z.object({
                content: z.string().min(1).max(1200).optional(),
                parentId: z.string().uuid().optional().nullable(),
                tagIds: z.array(z.string().uuid()).optional(),
            })
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const service = new NoteService(req.jwt!);
        const note = await service.updateNote(id, req.body);
        return note;
    });

    // Delete note
    app.delete('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            })
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const service = new NoteService(req.jwt!);
        await service.deleteNote(id);
        return reply.status(204).send();
    });
};

export default crudRoutes;
