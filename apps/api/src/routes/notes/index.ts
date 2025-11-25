import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import summarizeRoutes from './summarize';
import combineRoutes from './combine';
import crudRoutes from './crud';

const notesRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    // Register CRUD routes first (for /api/notes, /api/notes/:id)
    await app.register(crudRoutes);
    
    // Then register special routes (/api/notes/summarize, /api/notes/combine)
    await app.register(summarizeRoutes);
    await app.register(combineRoutes);
};

export default notesRoutes;
