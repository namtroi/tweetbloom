import 'dotenv/config'; // Load .env FIRST!

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { validateEnv } from './config/env';

// Import routes
import chatRoutes from './routes/chat';
import folderRoutes from './routes/folders';
import notesRoutes from './routes/notes';
import tagRoutes from './routes/tags';
import continueRoutes from './routes/chat/continue';

// Validate environment variables (after dotenv loaded)
const env = validateEnv();

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
}).withTypeProvider<ZodTypeProvider>();

// Set up Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register plugins
app.register(cors, {
  origin: true,
  credentials: true,
});

app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
});

// Register Swagger
app.register(swagger, {
  openapi: {
    info: {
      title: 'TweetBloom API',
      description: 'API for TweetBloom - AI-powered prompt management',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
  },
});

app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
});

// Register routes
app.register(chatRoutes, { prefix: '/api/chat' });
app.register(continueRoutes, { prefix: '/api/chat/continue' });
app.register(folderRoutes, { prefix: '/api/folders' });
app.register(notesRoutes, { prefix: '/api/notes' });
app.register(tagRoutes, { prefix: '/api/tags' });

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📚 API docs available at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
