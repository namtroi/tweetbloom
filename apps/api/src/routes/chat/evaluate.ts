import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ChatEvaluateRequestSchema, ChatEvaluateResponseSchema } from '@tweetbloom/types';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';
import { BloomBuddyService } from '../../services/ai/bloom-buddy';
import { RATE_LIMITS } from '../../config/rate-limits';

const evaluateRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/evaluate', {
        preHandler: [authMiddleware],
        config: {
            rateLimit: {
                max: RATE_LIMITS.evaluate.max,
                timeWindow: RATE_LIMITS.evaluate.timeWindow
            }
        },
        schema: {
            body: ChatEvaluateRequestSchema,
            response: {
                200: ChatEvaluateResponseSchema
            }
        }
    }, async (req, reply) => {
        const { chatId, messageId } = req.body;
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

        // Note: messageId is accepted but not currently used
        // It could be used in the future to provide context-specific suggestions
        const result = await BloomBuddyService.getInstance().suggestNextPrompt(history);

        return result;
    });
};

export default evaluateRoutes;
