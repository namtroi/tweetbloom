import { z } from 'zod';

/**
 * Environment variables schema
 * Validates all required environment variables at server startup
 */
const envSchema = z.object({
  // Supabase Configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // AI Provider Keys (at least GEMINI is required)
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GROK_API_KEY: z.string().min(1).optional(),
  
  // AI Model Identifiers (with defaults)
  GEMINI_AI: z.string().default('gemini-2.0-flash-exp'),
  OPENAI_AI: z.string().default('gpt-4o-mini'),
  GROK_AI: z.string().default('grok-beta'),
  
  // Server Configuration
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database (optional, for direct connection if needed)
  DATABASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Exits process with error if validation fails
 */
export function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);
    return validated;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error('');
    
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        console.error(`  ❌ ${path}: ${err.message}`);
      });
      
      console.error('');
      console.error('💡 Please check your .env file and ensure all required variables are set.');
      console.error('   See .env.example for reference.');
    } else {
      console.error(error);
    }
    
    console.error('');
    process.exit(1);
  }
}

/**
 * Singleton instance of validated environment
 * Use this instead of process.env for type safety
 */
let envInstance: Env | null = null;

export function getEnv(): Env {
  if (!envInstance) {
    envInstance = validateEnv();
  }
  return envInstance;
}

/**
 * Reset environment instance (for testing only)
 * @internal
 */
export function resetEnv(): void {
  envInstance = null;
}
