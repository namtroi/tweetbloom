import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { createClient } from '@supabase/supabase-js';

// Extend FastifyRequest to include user
declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string;
            email?: string;
        };
        jwt?: string;
    }
}

export const authMiddleware = async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return reply.status(401).send({ error: 'Missing Authorization Header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // We verify the JWT by creating a dummy client or using Supabase's getUser
    // Using the stateless verification is faster if we trust the signature, 
    // but calling getUser ensures the token isn't revoked.
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return reply.status(401).send({ error: 'Invalid or Expired Token' });
    }

    // Attach user and token to request
    req.user = { id: user.id, email: user.email };
    req.jwt = token;
};
