import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import { serializerCompiler, validatorCompiler, ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authMiddleware } from './middleware/auth';
import chatRoutes from './routes/chat';
import notesRoutes from './routes/notes';
import { validateEnv } from './config/env';
import { rateLimitErrorResponse } from './config/rate-limits';

// Validate environment variables at startup (fail fast)
const env = validateEnv();

const app = Fastify({
    logger: true,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Register Plugins and Routes inside start to ensure order
const start = async () => {
    try {
        // Register CORS
        await app.register(cors, {
            origin: '*', // TODO: Lock this down in production
        });

        // Register Rate Limiting
        await app.register(rateLimit, {
            global: true,
            max: 100, // Default global limit
            timeWindow: '1 minute',
            errorResponseBuilder: rateLimitErrorResponse
        });

        // Register Swagger
        await app.register(swagger, {
            openapi: {
                openapi: '3.0.0',
                info: {
                    title: 'TweetBloom API',
                    description: 'API for TweetBloom AI Prompt Optimizer',
                    version: '1.0.0',
                },
                servers: [],
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transform: (arg: any) => {
                const { schema, url, route, swaggerObject } = arg;
                if (url.startsWith('/docs')) {
                    return { schema, url };
                }
                try {
                    return jsonSchemaTransform({ schema, url, route, swaggerObject });
                } catch (err) {
                    console.error('Transform error for', url, err);
                    return { schema, url };
                }
            },
        });

        // Register Swagger UI
        await app.register(swaggerUi, {
            routePrefix: '/docs',
        });

        // Health Check
        app.get('/health', {
            schema: {
                description: 'Check server health',
                tags: ['System'],
                response: {
                    200: z.object({
                        status: z.string(),
                        timestamp: z.string(),
                    }),
                },
            },
        }, async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // Register Routes
        await app.register(chatRoutes, { prefix: '/api/chat' });
        await app.register(notesRoutes, { prefix: '/api/notes' });

        await app.ready();

        const port = 3001;
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Docs available at http://localhost:${port}/docs`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
