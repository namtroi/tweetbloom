import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

// Import routes
import chatRoutes from '../routes/chat';
import folderRoutes from '../routes/folders';
import notesRoutes from '../routes/notes';
import tagRoutes from '../routes/tags';
import continueRoutes from '../routes/chat/continue';

/**
 * Build Fastify app for testing
 * This creates a fully configured Fastify instance without starting the server
 */
export async function build() {
  const app = Fastify({
    logger: false, // Disable logging in tests
  }).withTypeProvider<ZodTypeProvider>();

  // Set up Zod validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  // Register routes
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(continueRoutes, { prefix: '/api/chat/continue' });
  await app.register(folderRoutes, { prefix: '/api/folders' });
  await app.register(notesRoutes, { prefix: '/api/notes' });
  await app.register(tagRoutes, { prefix: '/api/tags' });

  return app;
}
