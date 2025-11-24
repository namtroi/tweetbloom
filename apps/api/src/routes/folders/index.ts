import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';

// Schemas
const CreateFolderSchema = z.object({
    name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long'),
});

const UpdateFolderSchema = z.object({
    name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long'),
});

const FolderResponseSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    name: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    chat_count: z.number().optional(),
});

const folderRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    // GET /api/folders - List all folders for current user
    app.get('/', {
        preHandler: [authMiddleware],
        schema: {
            response: {
                200: z.array(FolderResponseSchema)
            }
        }
    }, async (req, reply) => {
        const supabase = createUserClient(req.jwt!);

        // Fetch folders with chat count
        const { data: folders, error } = await supabase
            .from('folders')
            .select('*, chats(count)')
            .order('created_at', { ascending: false });

        if (error) {
            req.log.error(error, 'Failed to fetch folders');
            throw new Error('Failed to fetch folders');
        }

        // Transform response to include chat_count
        const foldersWithCount = (folders || []).map((folder: any) => ({
            id: folder.id,
            user_id: folder.user_id,
            name: folder.name,
            created_at: folder.created_at,
            updated_at: folder.updated_at,
            chat_count: folder.chats?.[0]?.count || 0,
        }));

        return foldersWithCount;
    });

    // POST /api/folders - Create new folder
    app.post('/', {
        preHandler: [authMiddleware],
        schema: {
            body: CreateFolderSchema,
            response: {
                201: FolderResponseSchema
            }
        }
    }, async (req, reply) => {
        const { name } = req.body;
        const supabase = createUserClient(req.jwt!);

        // Create folder
        const { data: folder, error } = await supabase
            .from('folders')
            .insert({
                name,
                user_id: req.user!.id,
            } as any) // Type assertion for Supabase insert
            .select()
            .single();

        if (error) {
            req.log.error(error, 'Failed to create folder');
            throw new Error('Failed to create folder');
        }

        reply.code(201);
        return {
            ...(folder as any),
            chat_count: 0,
        };
    });

    // PATCH /api/folders/:id - Update folder name
    app.patch('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid(),
            }),
            body: UpdateFolderSchema,
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const { name } = req.body;
        const supabase = createUserClient(req.jwt!);

        // Update folder
        const { data: folder, error } = await supabase
            .from('folders')
            .update({ name, updated_at: new Date().toISOString() } as any)
            .eq('id', id)
            .eq('user_id', req.user!.id) // Ensure user owns folder
            .select()
            .single();

        if (error || !folder) {
            req.log.error(error, 'Failed to update folder');
            return reply.code(404).send({ error: 'Folder not found' });
        }

        // Get chat count
        const { count } = await supabase
            .from('chats')
            .select('*', { count: 'exact', head: true })
            .eq('folder_id', id);

        return {
            ...(folder as any),
            chat_count: count || 0,
        };
    });

    // DELETE /api/folders/:id - Delete folder (chats move to root)
    app.delete('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid(),
            }),
        }
    }, async (req, reply) => {
        const { id } = req.params;
        const supabase = createUserClient(req.jwt!);

        // Delete folder (chats will have folder_id set to null due to "on delete set null")
        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user!.id); // Ensure user owns folder

        if (error) {
            req.log.error(error, 'Failed to delete folder');
            return reply.code(404).send({ error: 'Folder not found' });
        }

        reply.code(204).send();
    });
};

export default folderRoutes;
