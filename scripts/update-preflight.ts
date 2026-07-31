import { execFileSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
const checks:{name:string;ok:boolean;detail:string}[]=[];
function command(name:string,args:string[]){try{const out=execFileSync(name,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();checks.push({name:`${name} ${args.join(' ')}`,ok:true,detail:out.split('\n')[0]||'ok'});}catch(error:any){checks.push({name:`${name} ${args.join(' ')}`,ok:false,detail:error.stderr?.toString().trim()||error.message});}}
checks.push({name:'DATABASE_URL',ok:Boolean(process.env.DATABASE_URL),detail:process.env.DATABASE_URL?'configured':'missing'});
checks.push({name:'content directory',ok:existsSync(resolve(process.env.CONTENT_DIR||'content')),detail:resolve(process.env.CONTENT_DIR||'content')});
command('pg_dump',['--version']);command('docker',['version','--format','{{.Server.Version}}']);command('docker',['compose','version']);
console.table(checks);if(checks.some(c=>!c.ok))process.exit(1);
