import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ChatRequestSchema, ChatResponseSchema, ChatRowSchema, MessageRowSchema, UpdateChatSchema } from '@tweetbloom/types';
import { authMiddleware } from '../../middleware/auth';
import { createUserClient } from '../../lib/supabase';
import { BloomBuddyService } from '../../services/ai/bloom-buddy';
import { AIProviderFactory } from '../../services/ai/providers';
import { RATE_LIMITS } from '../../config/rate-limits';
import { truncateToLimits, getTruncationStats } from '../../utils/text-truncation';
import { ChatManagementService } from '../../services/chat-management';
import evaluateRoutes from './evaluate';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    await app.register(evaluateRoutes);

    app.post('/', {
        preHandler: [authMiddleware],
        config: {
            rateLimit: {
                max: RATE_LIMITS.chat.max,
                timeWindow: RATE_LIMITS.chat.timeWindow
            }
        },
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
                // @ts-expect-error - Supabase generated types don't properly infer insert return types. We validate with ChatRowSchema below.
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
            
            // Validate and extract chat data
            const validatedChat = ChatRowSchema.parse(newChat);
            chatId = validatedChat.id;
        }

        // 2. Save User Message
        const { data: userMsg, error: msgError } = await supabase
            .from('messages')
            // @ts-expect-error - Supabase generated types don't properly infer insert return types. We validate with MessageRowSchema below.
            .insert({
                chat_id: chatId!,
                role: 'user',
                content: prompt,
                type: 'text'
            })
            .select()
            .single();

        if (msgError || !userMsg) {
            req.log.error(msgError, 'Failed to save user message');
            throw new Error('Failed to save user message');
        }
        
        // Validate user message
        const validatedUserMsg = MessageRowSchema.parse(userMsg);

        // 3. Bloom Buddy Evaluation
        if (!override_ai_check) {
            const evaluation = await BloomBuddyService.getInstance().evaluatePrompt(prompt);

            if (evaluation.status === 'bad') {
                return {
                    status: 'suggestion' as const,
                    content: evaluation.suggestion,
                    reasoning: evaluation.reasoning,
                    chatId: chatId!,
                    messageId: validatedUserMsg.id
                };
            }
        }

        // 4. Execute AI (if good or overridden)
        // Map database AI tool names to provider types
        const providerTypeMap: Record<'GEMINI' | 'CHATGPT' | 'GROK', 'gemini' | 'openai' | 'grok'> = {
            'GEMINI': 'gemini',
            'CHATGPT': 'openai',
            'GROK': 'grok'
        };
        
        const providerType = providerTypeMap[selectedAiTool];
        const provider = AIProviderFactory.getInstance().getProvider(providerType);

        let aiResponse = await provider.generateResponse(prompt);
        
        // Apply truncation as safety net (in case AI doesn't comply)
        const originalResponse = aiResponse;
        aiResponse = truncateToLimits(aiResponse, 150, 1200);
        
        // Log if truncation occurred (for monitoring AI compliance)
        if (originalResponse !== aiResponse) {
            const stats = getTruncationStats(originalResponse, aiResponse);
            req.log.warn({
                provider: selectedAiTool,
                ...stats
            }, 'AI response truncated - provider not complying with limits');
        }

        // 5. Save Assistant Message
        const { data: assistantMsg, error: aiMsgError } = await supabase
            .from('messages')
            // @ts-expect-error - Supabase generated types don't properly infer insert return types. We validate with MessageRowSchema below.
            .insert({
                chat_id: chatId!,
                role: 'assistant',
                content: aiResponse,
                type: 'response'
            })
            .select()
            .single();

        if (aiMsgError || !assistantMsg) {
            req.log.error(aiMsgError, 'Failed to save AI message');
            throw new Error('Failed to save AI message');
        }
        
        // Validate AI message
        const validatedAiMsg = MessageRowSchema.parse(assistantMsg);

        return {
            status: 'success' as const,
            content: aiResponse,
            chatId: chatId!,
            messageId: validatedAiMsg.id
        };
    });
    // Get all chats
    app.get('/', {
        preHandler: [authMiddleware]
    }, async (req, reply) => {
        const supabase = createUserClient(req.jwt!);
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return data;
    });

    // Get single chat
    app.get('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            })
        }
    }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const supabase = createUserClient(req.jwt!);
        
        // Fetch chat with messages
        const { data: chat, error } = await supabase
            .from('chats')
            .select('*, messages(*)')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        
        // Sort messages by created_at
        const chatAny = chat as any;
        if (chatAny && chatAny.messages) {
            chatAny.messages.sort((a: any, b: any) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }
        
        return chat;
    });

    // Update chat (rename, move folder)
    app.patch('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            }),
            body: UpdateChatSchema
        }
    }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const service = new ChatManagementService(req.jwt!);
        const chat = await service.updateChat(id, req.body);
        return chat;
    });

    // Delete chat
    app.delete('/:id', {
        preHandler: [authMiddleware],
        schema: {
            params: z.object({
                id: z.string().uuid()
            })
        }
    }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const service = new ChatManagementService(req.jwt!);
        await service.deleteChat(id);
        return reply.status(204).send();
    });
};

export default chatRoutes;
