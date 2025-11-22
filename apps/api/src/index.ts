import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import dotenv from 'dotenv';

dotenv.config();

const app = Fastify({
    logger: true,
}).withTypeProvider<ZodTypeProvider>();

// Register Plugins
app.register(cors, {
    origin: '*', // TODO: Lock this down in production
});

app.register(swagger, {
    openapi: {
        info: {
            title: 'TweetBloom API',
            description: 'API for TweetBloom AI Prompt Optimizer',
            version: '1.0.0',
        },
        servers: [],
    },
});

app.register(swaggerUi, {
    routePrefix: '/docs',
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Health Check
app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start Server
const start = async () => {
    try {
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
