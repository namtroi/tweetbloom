import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ChatEvaluateRequestSchema, ChatEvaluateResponseSchema } from '@tweetbloom/types';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';
import { BloomBuddyService } from '../../services/ai/bloom-buddy';

const evaluateRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/evaluate', {
        preHandler: [authMiddleware],
        schema: {
            body: ChatEvaluateRequestSchema,
            response: {
                200: ChatEvaluateResponseSchema
            }
        }
    }, async (req, reply) => {
        const { chatId } = req.body;
        const supabase = createUserClient(req.jwt!);

        // Fetch last 10 messages
        const { data: messages, error } = await supabase
            .from('messages')
            .select('role, content')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            req.log.error(error, 'Failed to fetch messages');
            throw new Error('Failed to fetch messages');
        }

        // Reverse to get chronological order
        const history = (messages || []).reverse() as { role: string; content: string }[];

        const suggestion = await BloomBuddyService.getInstance().suggestNextPrompt(history);

        return suggestion;
    });
};

export default evaluateRoutes;
