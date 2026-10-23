import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';
import { operationCatalog } from '../src/operations.js';

async function connect(fetchImpl: typeof fetch) {
  const server = createServer({baseUrl:'https://api.test.invalid',apiKey:'bench_sk_fixture',fetchImpl});
  const client = new Client({name:'headless-test',version:'1'});
  const [a,b] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(a),server.connect(b)]);
  return {client,server};
}
function sample(schema: any): any {
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'object') return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key,schema]) => [key,sample(schema)]));
  if (schema.type === 'array') return [];
  if (schema.type === 'integer' || schema.type === 'number') return 1;
  if (schema.type === 'boolean') return true;
  if (schema.type === 'string') return 'fixture';
  return {};
}

describe('headless operations', () => {
  it('routes every new tool to its catalog endpoint without changing credentials or bodies', async () => {
    let current: any;
    let actual: {url:URL;init?:RequestInit}|undefined;
    const {client,server} = await connect(async(input,init) => {
      actual={url:new URL(String(input)),init};
      return new Response(JSON.stringify({operation:current.id}),{headers:{'Content-Type':'application/json'}});
    });
    try {
      for (const op of operationCatalog.operations as any[]) {
        if (!op.mcp || op.mcp_legacy) continue;
        current=op;actual=undefined;
        const args:Record<string,unknown>={};
        if(Object.keys(op.path_parameters).length)args.path=Object.fromEntries(Object.keys(op.path_parameters).map(key=>[key,'42']));
        if(op.body)args.body=sample(op.body);
        if(op.multipart){args.form={};args.files=[{name:'test.csv',content:'input,expected\nhello,world'}];}
        const result=await client.callTool({name:`bench_${op.id}`,arguments:args});
        expect(result.isError,op.id).not.toBe(true);
        expect(actual,op.id).toBeDefined();
        expect(actual!.url.pathname,op.id).toBe(op.path.replace(/\{[^}]+\}/g,'42'));
        expect(actual!.init!.method,op.id).toBe(op.method);
        expect(new Headers(actual!.init!.headers).get('Authorization')).toBe('Bearer bench_sk_fixture');
        if(op.body)expect(JSON.parse(actual!.init!.body as string)).toEqual(args.body);
      }
    } finally {await client.close();await server.close();}
  });
  it('accepts any extra key inside a registered tool, including output_schema, and forwards it unchanged',async()=>{
    // The catalog types a tool as {type: object}; bench-api alone decides whether an output_schema is usable
    // and answers with a per-call warning, so MCP must not reject a value it does not understand.
    const tools=[
      {name:'good',description:'d',input_schema:{type:'object',properties:{city:{type:'string'}}},output_schema:{type:'object',properties:{temperature:{type:'number'}},required:['temperature']}},
      {name:'flat',output_schema:{temperature:'number',conditions:'string'}},
      {name:'text',output_schema:'not a schema'},
      {type:'function',function:{name:'shaped',parameters:{type:'object',properties:{}},output_schema:{type:'object',properties:{}}}},
      {name:'extra','x-anything':[1,{a:null}]},
    ];
    const body={repo_full_name:'acme/docs',branch:'main',calls:[{key:'svc/a.py::run#0',key_source:'ast',shape:'S1',name:'run',scope:'production',
      configurations:[{source:'code',model:'gpt-x',tools}],
      fragments:[{id:'sys',role:'system',kind:'text',text:'You help.'}],verification:{level:'declared_only'}}]};
    let sent:unknown;
    const {client,server}=await connect(async(_input,init)=>{sent=JSON.parse(init!.body as string);return new Response('{"calls":[]}',{headers:{'Content-Type':'application/json'}});});
    try{
      const result=await client.callTool({name:'bench_register_calls',arguments:{path:{id:42},body}});
      expect(result.isError).not.toBe(true);
      expect(sent).toEqual(body);
    }finally{await client.close();await server.close();}
  });
  it('tells the agent what output_schema is, in the description of a call\'s tools',async()=>{
    const {client,server}=await connect(async()=>new Response('{}'));
    try{
      const {tools}=await client.listTools();
      const register=tools.find(tool=>tool.name==='bench_register_calls');
      const described=JSON.stringify(register!.inputSchema);
      expect(described).toContain('output_schema');
      expect(described).toContain('Bench checks simulated replies against it');
    }finally{await client.close();await server.close();}
  });
  it('uploads binary datasets and JSON mappings as multipart, preserving bytes',async()=>{
    let received:FormData|undefined;
    const {client,server}=await connect(async(input,init)=>{
      received=await new Request(input,init).formData();
      return new Response('{"dataset":{"id":"dataset-fixture"}}',{headers:{'Content-Type':'application/json'}});
    });
    try{
      const data=Buffer.from([0x50,0x4b,0,255,128]);
      const result=await client.callTool({name:'bench_upload_dataset',arguments:{path:{id:2},form:{mode:'recorded_outputs',mapping:{input:'question',expected:'answer'},content_consent:true},files:[{name:'cases.xlsx',content_base64:data.toString('base64')}]}});
      expect(result.isError).not.toBe(true);
      expect(JSON.parse(received!.get('mapping') as string)).toEqual({input:'question',expected:'answer'});
      expect(received!.get('content_consent')).toBe('true');
      expect(Buffer.from(await (received!.get('file') as File).arrayBuffer())).toEqual(data);
    }finally{await client.close();await server.close();}
  });
  it('rejects traversal and conflicting file encodings before HTTP',async()=>{
    let calls=0;
    const {client,server}=await connect(async()=>{calls++;return new Response('{}');});
    try{
      for(const value of ['..','%2fadmin','one/two','a\\b']){
        const result=await client.callTool({name:'bench_delete_dataset',arguments:{path:{id:1,datasetID:value}}});
        expect(result.isError).toBe(true);
      }
      const result=await client.callTool({name:'bench_preview_dataset',arguments:{path:{id:1},files:[{name:'data.csv',content:'a',content_base64:'YQ=='}]}});
      expect(result.isError).toBe(true);expect(calls).toBe(0);
    }finally{await client.close();await server.close();}
  });
  it('returns actionable plan and OAuth errors without retrying',async()=>{
    for(const code of ['upgrade_required','growth_required','account_authorization_required','source_authorization_required','repo_not_allowed']){
      let calls=0;
      const {client,server}=await connect(async()=>{calls++;return new Response(JSON.stringify({error:{code,message:'Not allowed',upgrade_url:'https://stg.usebench.ai/plans',pricing_url:'https://stg.usebench.ai/plans',payment_confirmation_required:true}}),{status:403});});
      try{
        const result=await client.callTool({name:'bench_capabilities',arguments:{}});
        expect(result.isError).toBe(true);expect(result.structuredContent).toMatchObject({error:{code,retryable:false}});expect(calls).toBe(1);
        expect(result.structuredContent).toMatchObject({error:{upgrade_url:'https://stg.usebench.ai/plans',pricing_url:'https://stg.usebench.ai/plans',payment_confirmation_required:true}});
        expect(JSON.stringify(result.content)).toContain('https://stg.usebench.ai/plans');
      }finally{await client.close();await server.close();}
    }
  });
});
