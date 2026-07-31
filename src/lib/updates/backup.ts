import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { contentFolders, getContentPath } from '@/lib/content/paths';
import { getCoreBuildInfo } from '@/lib/version';

interface BackupInput { packageId?: number | null; packageSlug: string; packageType: 'CORE' | 'PLUGIN' | 'THEME'; version: string; jobId?: string; }
function timestamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
async function copyIfExists(source:string,destination:string){try{await fs.access(source);await fs.cp(source,destination,{recursive:true,force:true});return true;}catch{return false;}}
function runProcess(command:string,args:string[]){return new Promise<void>((resolve,reject)=>{const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],shell:process.platform==='win32'});let stderr='';child.stderr.on('data',chunk=>stderr+=chunk.toString());child.on('error',error=>reject(new Error(`${command} failed to start: ${error.message}`)));child.on('close',code=>code===0?resolve():reject(new Error(`${command} exited with code ${code}: ${stderr||'no stderr output'}`)));});}
async function checksum(file:string){const buffer=await fs.readFile(file);return createHash('sha256').update(buffer).digest('hex');}
async function createAndVerifyDatabaseDump(outputFile:string){const databaseUrl=process.env.DATABASE_URL;if(!databaseUrl)throw new Error('DATABASE_URL is not configured; cannot create database backup.');await runProcess('pg_dump',[databaseUrl,'--file',outputFile,'--format','custom','--no-owner','--no-acl']);const stat=await fs.stat(outputFile);if(stat.size===0)throw new Error('pg_dump produced an empty backup.');await runProcess('pg_restore',['--list',outputFile]);return {size:stat.size,sha256:await checksum(outputFile),format:'postgres-custom'};}

export async function createPreUpdateBackup(input:BackupInput){
 await fs.mkdir(contentFolders.backups(),{recursive:true});
 const backupName=`${input.packageType.toLowerCase()}-${input.packageSlug}-${timestamp()}`;const backupDir=path.join(contentFolders.backups(),backupName);await fs.mkdir(backupDir,{recursive:true});
 try{
  const databaseDumpPath=path.join(backupDir,'database.dump');const databaseDump=await createAndVerifyDatabaseDump(databaseDumpPath);
  const contentBackupDir=path.join(backupDir,'content');await fs.mkdir(contentBackupDir,{recursive:true});
  const copied={uploads:await copyIfExists(contentFolders.uploads(),path.join(contentBackupDir,'uploads')),plugins:await copyIfExists(contentFolders.plugins(),path.join(contentBackupDir,'plugins')),themes:await copyIfExists(contentFolders.themes(),path.join(contentBackupDir,'themes'))};
  const build=getCoreBuildInfo();const manifest={packageSlug:input.packageSlug,packageType:input.packageType,version:input.version,jobId:input.jobId||null,createdAt:new Date().toISOString(),databaseDump:{file:'database.dump',...databaseDump},copied,contentDir:getContentPath(),core:build};
  await fs.writeFile(path.join(backupDir,'manifest.json'),JSON.stringify(manifest,null,2),'utf8');
  const record=await prisma.packageBackup.create({data:{packageId:input.packageId||null,packageSlug:input.packageSlug,packageType:input.packageType,version:input.version,backupPath:backupDir}});return {record,backupDir,manifest};
 }catch(error){await fs.rm(backupDir,{recursive:true,force:true});throw error;}
}
