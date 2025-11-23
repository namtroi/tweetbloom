import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ChatRequestSchema, ChatResponseSchema } from '@tweetbloom/types';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';
import { BloomBuddyService } from '../../services/ai/bloom-buddy';
import { AIProviderFactory } from '../../services/ai/providers';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/', {
        preHandler: [authMiddleware],
        schema: {
            body: ChatRequestSchema,
            response: {
                200: ChatResponseSchema
            }
        }
    }, async (req, reply) => {
        const { prompt, chatId: providedChatId, aiTool, override_ai_check } = req.body;
        const user = req.user!;
        const supabase = createUserClient(req.jwt!);

        let chatId = providedChatId;

        // Default AI Tool
        const selectedAiTool = (aiTool || 'GEMINI') as 'GEMINI' | 'CHATGPT' | 'GROK';

        // 1. Create Chat if not exists
        if (!chatId) {
            const { data: newChat, error: chatError } = await supabase
                .from('chats')
                // @ts-ignore
                .insert({
                    user_id: user.id,
                    title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
                    ai_tool: selectedAiTool
                })
                .select()
                .single();

            if (chatError || !newChat) {
                req.log.error(chatError, 'Failed to create chat');
                throw new Error('Failed to create chat');
            }
            chatId = (newChat as any).id;
        }

        // 2. Save User Message
        const { data: userMsg, error: msgError } = await supabase
            .from('messages')
            // @ts-ignore
            .insert({
                chat_id: chatId!,
                role: 'user',
                content: prompt,
                type: 'text'
            })
            .select()
            .single();

        if (msgError) {
            req.log.error(msgError, 'Failed to save message');
            throw new Error('Failed to save message');
        }

        // 3. Bloom Buddy Evaluation
        if (!override_ai_check) {
            const evaluation = await BloomBuddyService.getInstance().evaluatePrompt(prompt);

            if (evaluation.status === 'bad') {
                return {
                    status: 'suggestion' as const,
                    content: evaluation.suggestion,
                    reasoning: evaluation.reasoning,
                    chatId: chatId!,
                    messageId: (userMsg as any)?.id
                };
            }
        }

        // 4. Execute AI (if good or overridden)
        const providerType = selectedAiTool.toLowerCase() as any;
        const provider = AIProviderFactory.getInstance().getProvider(providerType);

        const aiResponse = await provider.generateResponse(prompt);

        // 5. Save Assistant Message
        const { data: assistantMsg, error: aiMsgError } = await supabase
            .from('messages')
            // @ts-ignore
            .insert({
                chat_id: chatId!,
                role: 'assistant',
                content: aiResponse,
                type: 'response'
            })
            .select()
            .single();

        if (aiMsgError) {
            req.log.error(aiMsgError, 'Failed to save AI response');
            throw new Error('Failed to save AI response');
        }

        return {
            status: 'success' as const,
            content: aiResponse,
            chatId: chatId!,
            messageId: (assistantMsg as any)?.id
        };
    });
};

export default chatRoutes;
