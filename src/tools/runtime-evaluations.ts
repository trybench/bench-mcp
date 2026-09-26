import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { registerTool, type ToolContext } from './register.js';

export function registerRuntimeEvaluationTools(server: McpServer, context: ToolContext): void {
  const system = { ai_system_id: z.number().int().positive() };
  registerTool(server, context, {
    name: 'bench_runtime_eval_plan', title: 'Plan a runtime evaluation',
    description: 'Validate and save a pinned application experiment without paid execution. Supply policy, grouped cases, runtime, configurations and explicit budgets. Public benchmark priors guide search order only. Confirmation cases are never returned.',
    inputSchema: { ...system, spec: z.record(z.string(), z.unknown()) },
    handler: (args, ctx) => ctx.client.request(`/api/ai-systems/${args.ai_system_id}/evaluation-plans`, {method:'POST',body:args.spec}),
  });
  registerTool(server, context, {
    name: 'bench_runtime_eval_run', title: 'Start a runtime evaluation',
    description: 'Start a saved application plan within its explicit execution budgets. Requires user authorization for the plan. Reusing an idempotency key returns the same run. This executes the application adapter, independently of legacy prompt evaluations.',
    inputSchema: { ...system, plan_id: z.string(), idempotency_key: z.string().min(8).max(200) },
    handler: (args, ctx) => ctx.client.request(`/api/ai-systems/${args.ai_system_id}/evaluation-runs`, {method:'POST',body:{plan_id:args.plan_id},idempotencyKey:args.idempotency_key as string}),
  });
  registerTool(server, context, {
    name: 'bench_runtime_eval_results', title: 'Read runtime evaluation evidence', readOnly:true,
    description: 'Read job status, separate evaluation decision, grouped uncertainty, costs, latency, and development evidence. A completed job may find no demonstrated improvement. Does not expose confirmation inputs or answers.',
    inputSchema: { ...system, run_id: z.string() },
    handler: (args, ctx) => ctx.client.request(`/api/ai-systems/${args.ai_system_id}/evaluation-runs/${encodeURIComponent(args.run_id as string)}`),
  });
  registerTool(server, context, {
    name: 'bench_runtime_eval_events', title: 'Read durable evaluation events', readOnly:true,
    description: 'Read progress after a resumable event cursor. Persist the last cursor and poll without restarting work.',
    inputSchema: { ...system, run_id: z.string(), after:z.number().int().nonnegative().default(0) },
    handler: (args, ctx) => ctx.client.request(`/api/ai-systems/${args.ai_system_id}/evaluation-runs/${encodeURIComponent(args.run_id as string)}/events`,{query:{after:args.after as number}}),
  });
  registerTool(server, context, {
    name: 'bench_runtime_eval_control', title: 'Control a runtime evaluation',
    description: 'Cancel a run, resume a safely checkpointed canceled run, or continue a paused run. A budget pause needs extend_budget; a possibly billed lost attempt needs retry_ambiguous_attempt=true and is charged conservatively. Completed confirmation and plans needing more independent data are never silently repeated.',
    inputSchema: { ...system, run_id:z.string(), action:z.enum(['cancel','resume']), idempotency_key:z.string().min(8),
      extend_budget: z.object({ max_cost_usd: z.number().positive().optional(), max_trials: z.number().int().positive().optional(), max_duration_s: z.number().positive().optional() }).strict().optional(),
      retry_ambiguous_attempt: z.boolean().optional() },
    handler: (args,ctx)=>ctx.client.request(`/api/ai-systems/${args.ai_system_id}/evaluation-runs/${encodeURIComponent(args.run_id as string)}/${args.action}`,{method:'POST',body:args.action==='resume'?{...(args.extend_budget?{extend_budget:args.extend_budget}:{}),...(args.retry_ambiguous_attempt?{retry_ambiguous_attempt:true}:{})}:{},idempotencyKey:args.idempotency_key as string}),
  });
  registerTool(server, context, {
    name: 'bench_runtime_eval_review_cases',title:'Read development cases for review',readOnly:true,
    description:'Return development inputs and expected outcomes for human grounding. Confirmation cases are protected. Reviews are diagnostic until included in a new immutable plan.',
    inputSchema:{...system,plan_id:z.string()},
    handler:(args,ctx)=>ctx.client.request(`/api/ai-systems/${args.ai_system_id}/evaluation-plans/${encodeURIComponent(args.plan_id as string)}/review`),
  });
  registerTool(server, context, {
    name:'bench_runtime_eval_review',title:'Review a development case',
    description:'Save a human good, bad or skip judgment with a note. Never modify a frozen confirmation design.',
    inputSchema:{...system,plan_id:z.string(),case_id:z.string(),verdict:z.enum(['good','bad','skip']),note:z.string().max(2000).default('')},
    handler:(args,ctx)=>ctx.client.request(`/api/ai-systems/${args.ai_system_id}/evaluation-plans/${encodeURIComponent(args.plan_id as string)}/review`,{method:'POST',body:{case_id:args.case_id,verdict:args.verdict,note:args.note}}),
  });
}
