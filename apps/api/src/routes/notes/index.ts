import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import summarizeRoutes from './summarize';
import combineRoutes from './combine';

const notesRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    await app.register(summarizeRoutes);
    await app.register(combineRoutes);
};

export default notesRoutes;
