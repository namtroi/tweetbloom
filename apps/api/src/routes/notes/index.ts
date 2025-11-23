import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import summarizeRoutes from './summarize';

const notesRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    await app.register(summarizeRoutes);
};

export default notesRoutes;
