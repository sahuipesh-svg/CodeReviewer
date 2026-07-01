import { betterAuth } from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import prisma from "./db";

const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim();
const appBaseHost = appBaseUrl ? new URL(appBaseUrl).host : undefined;

export const auth = betterAuth({
    baseURL:{
        allowedHosts:Array.from(
            new Set(
                [
                    "localhost:*",
                    "127.0.0.1:*",
                    "[::1]:*",
                    "*.ngrok-free.dev",
                    appBaseHost,
                ].filter(Boolean) as string[]
            )
        ),
        fallback:betterAuthUrl ?? "http://localhost:3000",
        protocol:"auto",
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    socialProviders:{
        github:{
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            scope:["repo"]
        }
    },
    trustedOrigins:Array.from(
        new Set(
            [
                betterAuthUrl,
                appBaseUrl,
                "http://localhost:*",
                "https://localhost:*",
                "http://127.0.0.1:*",
                "https://127.0.0.1:*",
                "https://*.ngrok-free.dev",
            ].filter(Boolean) as string[]
        )
    ),
});



