import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { REPORT_CATEGORIES } from "@/lib/reportCategories";
import { AREA_TO_MLA } from "@/public/data/areaToMla";
import FeedCard from "@/app/_components/common/FeedCard";
import ReportsGlobalMapClient from "@/app/_components/reports/ReportsGlobalMapClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authServer";
import {
  Filter,
  Navigation,
  ChevronRight,
  Plus,
} from "lucide-react";

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { value: "latest", label: "Newest First" },
  { value: "upvoted", label: "Most Upvoted" },
  { value: "oldest-unresolved", label: "Oldest Unresolved" },
] as const;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "reopened", label: "Reopened" },
] as const;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    category?: string;
    area?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const sort = (SORT_OPTIONS.find((s) => s.value === params.sort)?.value ?? "latest") as (typeof SORT_OPTIONS)[number]["value"];
  const category = params.category ?? "";
  const area = params.area ?? "";
  const statusFilter = params.status ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id ?? null;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (area) where.areaName = area;
  if (sort === "oldest-unresolved") {
    where.status = { in: ["REPORTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED_PENDING_VERIFICATION", "REOPENED"] };
  }
  if (statusFilter === "open") {
    where.status = { in: ["REPORTED", "ASSIGNED"] };
  } else if (statusFilter === "in_progress") {
    where.status = "IN_PROGRESS";
  } else if (statusFilter === "resolved") {
    where.status = { in: ["CONFIRMED_FIXED", "RESOLVED_PENDING_VERIFICATION"] };
  } else if (statusFilter === "reopened") {
    where.status = "REOPENED";
  }

  const orderBy =
    sort === "upvoted"
      ? [{ upvoteCount: "desc" as const }, { createdAt: "desc" as const }]
      : sort === "oldest-unresolved"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { where: { isMain: true }, take: 1 },
        _count: { select: { comments: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  const upvotedIds = userId
    ? (
        await prisma.upvote.findMany({
          where: { userId, issueId: { in: reports.map((r : any) => r.id) } },
          select: { issueId: true },
        })
      ).map((u: any) => u.issueId)
    : [];

  
  const allMapReports = await prisma.report.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...where 
    },
    select: {
      id: true,
      title: true,
      areaName: true,
      category: true,
      latitude: true,
      longitude: true,
    }
  });

  
  const reportsWithCoords = allMapReports
    .filter((r : any) => r.latitude !== null && r.longitude !== null)
    .map((r : any) => ({
      id: r.id,
      title: r.title,
      areaName: r.areaName,
      category: r.category,
      latitude: r.latitude as number,
      longitude: r.longitude as number,
    }));

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="px-4 py-6 lg:p-10 max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8 lg:mb-10">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-2">Public Reports</h1>
          <p className="text-sm lg:text-base text-gray-500 font-medium">Browse and track active community issues across Hyderabad.</p>
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row lg:items-center">
          <form action="/feed" method="get" className="grid grid-cols-2 gap-2 w-full lg:flex lg:items-center lg:gap-3">
            <input type="hidden" name="page" value="1" />
            <select
              name="category"
              defaultValue={category}
              className="h-10 px-3 lg:px-4 bg-white border border-gray-200 rounded-2xl text-xs lg:text-sm font-bold text-gray-600 outline-none hover:border-green-300 transition-all cursor-pointer min-w-0"
            >
              <option value="">All Categories</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="h-10 px-3 lg:px-4 bg-white border border-gray-200 rounded-2xl text-xs lg:text-sm font-bold text-gray-600 outline-none hover:border-green-300 transition-all cursor-pointer min-w-0"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="col-span-2 lg:col-span-1 flex items-center justify-center gap-2 h-10 px-4 bg-white border border-gray-200 rounded-2xl text-xs lg:text-sm font-bold text-gray-500 hover:border-green-300 transition-all"
              title="Apply filters"
            >
              <Filter size={18} />
              <span className="lg:inline">Filters</span>
            </button>
          </form>
          <form action="/feed" method="get" className="w-full lg:w-auto">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="status" value={statusFilter} />
            <input type="hidden" name="sort" value={sort} />
            <button
              type="submit"
              name="near"
              value="1"
              className="flex w-full lg:w-auto items-center justify-center gap-2 h-10 px-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs lg:text-sm"
              title="Near Me"
            >
              <Navigation size={18} />
              <span>Near Me</span>
            </button>
          </form>
        </div>
      </div>

      <div className="mb-10 lg:mb-16 lg:-mx-10">
        <div className="bg-white shadow-2xl overflow-hidden relative group rounded-2xl lg:rounded-none">
          <div className="h-[min(50vh,380px)] lg:h-[550px]">
            <ReportsGlobalMapClient reports={reportsWithCoords} />
          </div>
        </div>
      </div>

      <div className="space-y-8 lg:space-y-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Recent Feed</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Showing {reports.length} of {total.toLocaleString()} results
            </p>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <span className="hidden sm:inline text-xs font-bold text-gray-400 uppercase tracking-widest">Sort:</span>
            <form action="/feed" method="get" className="w-full sm:w-auto">
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="category" value={category} />
              <input type="hidden" name="status" value={statusFilter} />
              <select
                name="sort"
                defaultValue={sort}
                className="w-full sm:w-auto bg-green-50 px-3 lg:px-4 py-2 rounded-xl text-xs font-bold text-green-600 outline-none cursor-pointer border border-green-100"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </form>
          </div>
        </div>

            {reports.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-400 font-bold">No issues match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reports.map((r : any, i : any) => {
                  const main = r.images[0];
                  const imgSrc = main ? main.url : null;
                  const daysOpen = Math.floor(
                    (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isEscalated = daysOpen >= 30 && !["CONFIRMED_FIXED", "REJECTED"].includes(r.status);

                  return (
                    <FeedCard
                      key={r.id}
                      id={r.id}
                      title={r.title}
                      areaName={r.areaName}
                      category={r.category}
                      status={r.status}
                      upvoteCount={r.upvoteCount}
                      commentCount={r._count.comments}
                      imgSrc={imgSrc}
                      isEscalated={isEscalated}
                      userUpvoted={upvotedIds.includes(r.id)}
                    />
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center pt-8 lg:pt-12">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto max-w-full px-0">
                  {page > 1 && (
                    <Link
                      href={`/feed?${new URLSearchParams({
                        ...(sort && { sort }),
                        ...(category && { category }),
                        ...(area && { area }),
                        ...(statusFilter && { status: statusFilter }),
                        page: String(page - 1),
                      }).toString()}`}
                      className="flex items-center justify-center gap-2 px-5 lg:px-8 py-3 lg:py-4 bg-white border-2 border-gray-100 rounded-2xl lg:rounded-[2.5rem] text-sm font-bold text-gray-500 hover:border-green-600 hover:text-green-600 transition-all no-underline"
                    >
                      ← Previous
                    </Link>
                  )}
                  <span className="flex items-center justify-center px-4 lg:px-6 py-3 lg:py-4 bg-green-50 text-green-600 font-bold text-sm rounded-2xl lg:rounded-[2.5rem] border border-green-100 text-center">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/feed?${new URLSearchParams({
                        ...(sort && { sort }),
                        ...(category && { category }),
                        ...(area && { area }),
                        ...(statusFilter && { status: statusFilter }),
                        page: String(page + 1),
                      }).toString()}`}
                      className="group flex items-center justify-center gap-2 px-5 lg:px-8 py-3 lg:py-4 bg-white border-2 border-gray-100 rounded-2xl lg:rounded-[2.5rem] text-sm font-bold text-gray-500 hover:border-green-600 hover:text-green-600 transition-all no-underline"
                    >
                      <span className="sm:hidden">More</span>
                      <span className="hidden sm:inline">Load More Reports</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
  );
}
