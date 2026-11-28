import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
const WORKERS = ['consumer', 'outbox', 'pending-references'] as const;

export type Worker = (typeof WORKERS)[number];

const booleanFlag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const positiveInt = (fallback: number) => z.coerce.number().int().positive().default(fallback);

const envSchema = z.object({
  HTTP_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  INSTANCE_ID: z.string().min(1).default(`instance-${process.pid}`),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: positiveInt(10),
  DATABASE_LOCK_TIMEOUT_MS: positiveInt(2_000),
  DATABASE_STATEMENT_TIMEOUT_MS: positiveInt(5_000),
  DATABASE_IDLE_IN_TRANSACTION_TIMEOUT_MS: positiveInt(10_000),
  SQS_ENDPOINT: z.url(),
  SQS_REGION: z.string().min(1).default('us-east-1'),
  SQS_COMMANDS_QUEUE: z.string().min(1).default('wager-transactions.fifo'),
  SQS_COMMANDS_DLQ: z.string().min(1).default('wager-transactions-dlq.fifo'),
  SQS_EVENTS_QUEUE: z.string().min(1).default('wager-events.fifo'),
  SQS_MAX_RECEIVE_COUNT: positiveInt(5),
  SQS_VISIBILITY_TIMEOUT_SECONDS: positiveInt(30),
  SQS_WAIT_TIME_SECONDS: z.coerce.number().int().min(0).max(20).default(5),
  SQS_CONSUMER_CONCURRENCY: positiveInt(2),
  APP_WORKERS: z
    .string()
    .default(WORKERS.join(','))
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    )
    .pipe(z.array(z.enum(WORKERS))),
  OUTBOX_POLL_INTERVAL_MS: positiveInt(250),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(10).default(10),
  PENDING_REFERENCE_POLL_INTERVAL_MS: positiveInt(500),
  PENDING_REFERENCE_TTL_MS: positiveInt(300_000),
  PENDING_REFERENCE_BASE_DELAY_MS: positiveInt(1_000),
  PENDING_REFERENCE_MAX_DELAY_MS: positiveInt(60_000),
  SHUTDOWN_TIMEOUT_MS: positiveInt(20_000),
  FAULT_INJECTION: booleanFlag,
  FAULT_POINTS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  AUTH_MODE: z.enum(['none']).default('none'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}
