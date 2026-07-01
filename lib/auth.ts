import { betterAuth } from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import prisma from "./db";

const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim();

export const auth = betterAuth({
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
                "http://localhost:3000",
                "https://localhost:3000",
            ].filter(Boolean) as string[]
        )
    ),
});



