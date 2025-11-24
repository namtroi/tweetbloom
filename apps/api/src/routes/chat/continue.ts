import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';
import { BloomBuddyService } from '../../services/ai/bloom-buddy';

const continueRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    // POST /api/summarize/chat-to-prompt
    app.post('/chat-to-prompt', {
        preHandler: [authMiddleware],
        schema: {
            body: z.object({
                chatId: z.string().uuid()
            }),
            response: {
                200: z.object({
                    new_prompt: z.string()
                })
            }
        }
    }, async (req, reply) => {
        const { chatId } = req.body;
        const supabase = createUserClient(req.jwt!);

        // Fetch chat with messages
        const { data: chat, error } = await supabase
            .from('chats')
            .select('*, messages(*)')
            .eq('id', chatId)
            .single();

        if (error || !chat) {
            throw new Error('Chat not found');
        }

        // Extract messages (user and assistant only, no suggestions)
        const chatData = chat as any; // Type assertion for Supabase query result
        const messages = (chatData.messages || [])
            .filter((msg: any) => 
                (msg.role === 'user' && msg.type === 'text') || 
                (msg.role === 'assistant' && msg.type === 'response')
            )
            .sort((a: any, b: any) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            .map((msg: any) => ({
                role: msg.role,
                content: msg.content
            }));

        // Use Bloom Buddy to synthesize the conversation into a new prompt
        const synthesizedPrompt = await BloomBuddyService.getInstance().synthesizeConversation(messages);

        return {
            new_prompt: synthesizedPrompt
        };
    });
};

export default continueRoutes;
