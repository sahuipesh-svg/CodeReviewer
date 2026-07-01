"use server";
import {
    fetchUserContribution, getGithubToken
} from "@/module/github/lib/github"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Octokit } from "octokit";
import prisma from "@/lib/db";

const CONTRIBUTION_LEVEL_MAX = 4;
const CONTRIBUTIONS_PER_LEVEL = 3;
const ACTIVITY_MONTH_COUNT = 6;
const GITHUB_SEARCH_PAGE_SIZE = 100;
const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const;

type ContributionDay = {
    date: string;
    contributionCount: number;
};

type ContributionWeek = {
    contributionDays: ContributionDay[];
};

type ContributionCalendar = {
    totalContributions: number;
    weeks: ContributionWeek[];
};

type MonthlyActivity = {
    commits: number;
    prs: number;
    reviews: number;
};

async function requireSessionUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    return session.user;
}

async function getAuthenticatedGithubUser(token: string) {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    return { octokit, user };
}

function getActivityStartDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - (ACTIVITY_MONTH_COUNT - 1), 1);
}

function createMonthlyActivityBuckets(): Record<string, MonthlyActivity> {
    const monthlyData: Record<string, MonthlyActivity> = {};
    const now = new Date();

    for (let i = ACTIVITY_MONTH_COUNT - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyData[MONTH_NAMES[date.getMonth()]] = { commits: 0, prs: 0, reviews: 0 };
    }

    return monthlyData;
}

function getMonthKey(date: Date) {
    return MONTH_NAMES[date.getMonth()];
}

function mapContributionCalendar(calendar: ContributionCalendar) {
    return calendar.weeks.flatMap((week) =>
        week.contributionDays.map((day) => ({
            date: day.date,
            count: day.contributionCount,
            level: Math.min(
                CONTRIBUTION_LEVEL_MAX,
                Math.floor(day.contributionCount / CONTRIBUTIONS_PER_LEVEL)
            ),
        }))
    );
}


export async function getContributionStats() {
    try {
        await requireSessionUser();
        const token = await getGithubToken();
        const { user } = await getAuthenticatedGithubUser(token);
        const calendar = await fetchUserContribution(token, user.login) as ContributionCalendar | null;

        if (!calendar) {
            return null;
        }

        return {
            contributions: mapContributionCalendar(calendar),
            totalContributions:calendar.totalContributions
        }

    } catch (error) {
        console.error("Error fetching contribution stats:", error);
        return null;
    }
}


export async function getDashboardStats() {
    try {
        const userSession = await requireSessionUser();
        const token = await getGithubToken();
        const { octokit, user } = await getAuthenticatedGithubUser(token);

        const [totalRepos, totalReviews, calendar, { data: prs }] = await Promise.all([
            prisma.repository.count({
                where: { userId: userSession.id },
            }),
            prisma.review.count({
                where: {
                    repository: {
                        userId: userSession.id,
                    },
                },
            }),
            fetchUserContribution(token, user.login) as Promise<ContributionCalendar | null>,
            octokit.rest.search.issuesAndPullRequests({
                q: `author:${user.login} type:pr`,
                per_page: 1
            }),
        ]);

        const totalCommits = calendar?.totalContributions || 0
        const totalPRs = prs.total_count

        return {
            totalCommits,
            totalPRs,
            totalReviews,
            totalRepos
        }

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            totalCommits: 0,
            totalPRs: 0,
            totalReviews: 0,
            totalRepos: 0,
        };
    }
}

export async function getMonthlyActivity() {
    try {
        const userSession = await requireSessionUser();
        const token = await getGithubToken();
        const { octokit, user } = await getAuthenticatedGithubUser(token);

        const calendar = await fetchUserContribution(token, user.login) as ContributionCalendar | null;

        if (!calendar) {
            return [];
        }

        const monthlyData = createMonthlyActivityBuckets();

        calendar.weeks.forEach((week) => {
            week.contributionDays.forEach((day) => {
                const date = new Date(day.date);
                const monthKey = getMonthKey(date);
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].commits += day.contributionCount;
                }
            })
        })

        const activityStartDate = getActivityStartDate();

        const reviews = await prisma.review.findMany({
            where: {
                createdAt: {
                    gte: activityStartDate,
                },
                repository: {
                    userId: userSession.id,
                },
            },
            select: {
                createdAt: true,
            },
        });
        
        reviews.forEach((review) => {
            const monthKey = getMonthKey(review.createdAt);
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].reviews += 1;
            }
        })

        const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:pr created:>${activityStartDate.toISOString().split("T")[0]
                }`,
            per_page: GITHUB_SEARCH_PAGE_SIZE,
        });

        prs.items.forEach((pr) => {
            const date = new Date(pr.created_at);
            const monthKey = getMonthKey(date);
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].prs += 1;
            }
        });

        return Object.keys(monthlyData).map((name) => ({
            name,
            ...monthlyData[name]
        }))

    } catch (error) {
        console.error("Error fetching monthly activity:", error);
        return [];
    }
}
