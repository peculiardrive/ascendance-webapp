import { prisma } from "@/lib/prisma";
import { adminSessionFrom } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: adminSession.sub } });
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const totalUsers = await prisma.user.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const signupsToday = await prisma.user.count({
      where: { createdAt: { gte: today } }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const signupsWeek = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });

    // Device distribution
    const desktopActivities = await prisma.userActivity.count({
      where: { device: "Desktop" }
    });
    const mobileActivities = await prisma.userActivity.count({
      where: { device: "Mobile" }
    });

    // Action breakdown
    const actionCounts = await prisma.userActivity.groupBy({
      by: ["action"],
      _count: { id: true }
    });

    // Popular chapters view counts based on UserActivity
    const chapterViews = await prisma.userActivity.findMany({
      where: { action: "VIEW_CHAPTER" },
      select: { details: true }
    });

    const chapterCounts = {};
    for (const view of chapterViews) {
      const details = view.details;
      const chapterId = details?.chapterId || "unknown";
      if (!chapterCounts[chapterId]) {
        chapterCounts[chapterId] = {
          chapterTitle: details?.chapterTitle || "Unknown Chapter",
          bookTitle: details?.bookTitle || "Unknown Book",
          count: 0
        };
      }
      chapterCounts[chapterId].count++;
    }

    const formattedChapterViews = Object.values(chapterCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent 100 activities
    const recentActivities = await prisma.userActivity.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers,
        signupsToday,
        signupsWeek,
        devices: {
          desktop: desktopActivities,
          mobile: mobileActivities
        },
        actions: actionCounts.reduce((acc, curr) => {
          acc[curr.action] = curr._count.id;
          return acc;
        }, {}),
        popularChapters: formattedChapterViews
      },
      activities: recentActivities.map(a => {
        const details = typeof a.details === 'object' && a.details !== null ? a.details : {};
        const displayName = details.donorName || details.fullName || (a.user ? a.user.fullName : "Guest Reader");
        return {
          id: a.id,
          email: a.email || (a.user ? a.user.email : "Guest"),
          fullName: displayName,
          action: a.action,
          details: a.details,
          device: a.device,
          createdAt: a.createdAt
        };
      })
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
