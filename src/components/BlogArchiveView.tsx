import React from 'react';
import { BlogPost, BlogCategory } from '../types/blog';
import { Calendar, Radio, ArrowRight, MessageSquare, Heart, Clock } from 'lucide-react';

interface BlogArchiveViewProps {
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  onSelectCategory: (category: BlogCategory) => void;
  onOpenNewPost?: () => void;
}

interface GroupedArchive {
  periodKey: string; // e.g. "2026-10"
  periodLabel: string; // e.g. "October 2026"
  posts: BlogPost[];
}

export const BlogArchiveView: React.FC<BlogArchiveViewProps> = ({
  posts,
  onSelectPost,
  onSelectCategory,
  onOpenNewPost
}) => {
  // Group posts by Year-Month
  const groupedArchives: GroupedArchive[] = React.useMemo(() => {
    const map = new Map<string, BlogPost[]>();

    // Sort descending by publication date
    const sorted = [...posts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    sorted.forEach((post) => {
      const date = new Date(post.publishedAt);
      const year = date.getFullYear() || 2026;
      const month = date.getMonth(); // 0-11
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(post);
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const result: GroupedArchive[] = [];
    map.forEach((groupPosts, key) => {
      const [yearStr, monthStr] = key.split('-');
      const monthIndex = parseInt(monthStr, 10) - 1;
      const label = `${monthNames[monthIndex]} ${yearStr}`;
      result.push({
        periodKey: key,
        periodLabel: label,
        posts: groupPosts
      });
    });

    return result;
  }, [posts]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>FIELD LOG CHRONICLES · CHRONOLOGICAL ARCHIVE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Transmission Archive
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Complete historical index of all published SDR experiments, field activations, and club logs organized by month.
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            <span className="text-white font-bold block tabular-nums text-sm">{posts.length}</span>
            <span className="text-[11px] text-slate-500">Transmissions</span>
          </div>
          <div className="h-5 w-px bg-slate-800" />
          <div>
            <span className="text-amber-400 font-bold block tabular-nums text-sm">
              {groupedArchives.length}
            </span>
            <span className="text-[11px] text-slate-500">Active Months</span>
          </div>
        </div>
      </div>

      {/* Archive Groups */}
      <div className="space-y-8">
        {groupedArchives.map((group) => (
          <section key={group.periodKey} className="space-y-3">
            {/* Month/Year Section Marker */}
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-bold text-amber-400">
                {group.periodLabel}
              </h3>
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs font-mono text-slate-500">
                {group.posts.length} {group.posts.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* List of Posts for this Month */}
            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              {group.posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Unboxed Metadata Line */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                      <span className="text-slate-300 tabular-nums">
                        {post.publishedAt}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCategory(post.category);
                        }}
                        className="text-amber-400 font-medium hover:underline"
                      >
                        {post.category}
                      </button>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-400">{post.band}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-500">{post.qthGrid}</span>
                    </div>

                    {/* Post Title */}
                    <h4 className="font-display text-base font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                      {post.title}
                    </h4>

                    {/* Short Excerpt */}
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Actions & Metrics on right side */}
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0 sm:self-center">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTimeMinutes}m</span>
                    </span>

                    <span className="flex items-center gap-1 text-slate-500">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{post.comments.length}</span>
                    </span>

                    <span className="flex items-center gap-1 text-slate-500">
                      <Heart className="w-3.5 h-3.5 text-rose-400/80" />
                      <span className="tabular-nums">{post.likes}</span>
                    </span>

                    <div className="flex items-center gap-1 text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span className="hidden md:inline text-[11px]">Read</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {groupedArchives.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Radio className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-display text-lg font-bold text-white">
              No Archived Transmissions Yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your chronological archive is currently empty. As you publish SDR and ham radio field logs, they will be cataloged here month by month.
            </p>
            {onOpenNewPost && (
              <div className="pt-2">
                <button
                  onClick={onOpenNewPost}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors"
                >
                  Write Your First Transmission
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
