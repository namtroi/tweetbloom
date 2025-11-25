import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth';
import { TagService } from '../../services/tag';

const tagRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    // Get all tags
    app.get('/', {
        preHandler: [authMiddleware],
    }, async (req, reply) => {
        const service = new TagService(req.jwt!);
        const tags = await service.getTags();
        return tags;
    });

    // Create tag
    app.post('/', {
        preHandler: [authMiddleware],
        schema: {
            body: z.object({
                name: z.string().min(1).max(50),
                color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
            })
        }
    }, async (req, reply) => {
        const service = new TagService(req.jwt!);
        const tag = await service.createTag(req.body);
        return reply.status(201).send(tag);
    });

    // Update tag
    app.patch('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            }),
            body: z.object({
                name: z.string().min(1).max(50).optional(),
                color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
            })
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const service = new TagService(req.jwt!);
        const tag = await service.updateTag(id, req.body);
        return tag;
    });

    // Delete tag
    app.delete('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            })
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const service = new TagService(req.jwt!);
        await service.deleteTag(id);
        return reply.status(204).send();
    });
};

export default tagRoutes;
