import "server-only";
import { Client, Databases, Storage, Teams, Users } from "node-appwrite";
import { readServerEnvironment } from "@/src/config/env";
export function createAppwriteAdmin(){const env=readServerEnvironment();const client=new Client().setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT).setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID).setKey(env.APPWRITE_API_KEY);return{client,databases:new Databases(client),storage:new Storage(client),teams:new Teams(client),users:new Users(client)}}
/** Admin clients bypass Appwrite permissions. Use only after MAT, academy and capability checks. */
