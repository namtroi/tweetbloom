import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CreateFolderSchema, UpdateFolderSchema } from '@tweetbloom/types';
import { authMiddleware } from '../../middleware/auth';
import { FolderService } from '../../services/folder';

const folderRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    // Get all folders
    app.get('/', {
        preHandler: [authMiddleware],
    }, async (req, reply) => {
        const service = new FolderService(req.jwt!);
        const folders = await service.getFolders();
        return folders;
    });

    // Create folder
    app.post('/', {
        preHandler: [authMiddleware],
        schema: {
            body: CreateFolderSchema
        }
    }, async (req, reply) => {
        const service = new FolderService(req.jwt!);
        const folder = await service.createFolder(req.body);
        return reply.status(201).send(folder);
    });

    // Update folder
    app.patch('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            }),
            body: UpdateFolderSchema
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const service = new FolderService(req.jwt!);
        const folder = await service.updateFolder(id, req.body);
        return folder;
    });

    // Delete folder
    app.delete('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            })
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const service = new FolderService(req.jwt!);
        await service.deleteFolder(id);
        return reply.status(204).send();
    });
};

export default folderRoutes;
