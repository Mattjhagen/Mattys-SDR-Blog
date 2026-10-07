import React, { useState } from 'react';
import { BlogPost } from '../types/blog';
import { Radio, Heart, MessageSquare, ArrowRight, Play } from 'lucide-react';
import { morsePlayer } from '../utils/morseAudio';

interface PostCardProps {
  post: BlogPost;
  onSelect: (post: BlogPost) => void;
  onLike: (e: React.MouseEvent, postId: string) => void;
  onSelectCategory?: (category: BlogPost['category']) => void;
  onSelectTag?: (tag: string) => void;
  onEditPost?: (post: BlogPost) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onSelect,
  onLike,
  onSelectCategory,
  onSelectTag,
  onEditPost
}) => {
  const [imageError, setImageError] = useState(false);
  const [isPlayingCallsign, setIsPlayingCallsign] = useState(false);

  const handlePlayMorse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingCallsign) {
      morsePlayer.stop();
      setIsPlayingCallsign(false);
      return;
    }
    setIsPlayingCallsign(true);
    morsePlayer.play(post.authorCallsign, 22, 700, undefined, () => {
      setIsPlayingCallsign(false);
    });
  };

  return (
    <article
      onClick={() => onSelect(post)}
      className="group relative flex flex-col bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5"
    >
      {/* Visual Media Header */}
      <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
        {!imageError && post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800">
            <Radio className="w-8 h-8 text-amber-400/60 mb-2" />
            <span className="font-mono text-xs text-slate-400">{post.band}</span>
          </div>
        )}

        {/* Ambient Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent pointer-events-none" />

        {/* Overlaid Unboxed Telemetry Info */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-xs font-mono text-slate-300 drop-shadow">
          <span className="text-amber-300 font-semibold">{post.band}</span>
          <span>{post.qthGrid}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Discipline: Clean unboxed text with typographic separators (NO PILLS) */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectCategory) onSelectCategory(post.category);
              }}
              className="text-amber-400 font-medium hover:underline cursor-pointer"
            >
              {post.category}
            </button>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{post.publishedAt}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{post.readTimeMinutes} min read</span>
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="mt-2.5 text-xs leading-relaxed text-slate-400 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Tags list on card */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-400">
              {post.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  className="text-slate-400 hover:text-amber-300 hover:underline transition-colors"
                >
                  #{tag}
                </button>
              ))}
              {post.tags.length > 3 && (
                <span className="text-slate-600">+{post.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Rig & Gear Details */}
          {post.rigEquipment && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 truncate">
              <span className="text-slate-500">RIG:</span>
              <span className="text-slate-300 truncate">{post.rigEquipment}</span>
            </div>
          )}
        </div>

        {/* Card Footer: Author Callsign & Actions */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between">
          {/* Author Call & Morse Preview Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayMorse}
              title={`Play ${post.authorCallsign} in CW Morse Code`}
              className="p-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Play className={`w-3 h-3 fill-current ${isPlayingCallsign ? 'text-amber-300 animate-pulse' : ''}`} />
            </button>
            <div className="text-xs">
              <span className="font-mono font-bold text-white tracking-wide">
                {post.authorCallsign}
              </span>
              <span className="text-slate-500 text-[11px] ml-1.5">
                ({post.authorName})
              </span>
            </div>
          </div>

          {/* Social Stats */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <button
              onClick={(e) => onLike(e, post.id)}
              className="flex items-center gap-1 hover:text-rose-400 transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${post.likes > 0 ? 'text-rose-400/90' : 'text-slate-500'}`} />
              <span className="font-mono tabular-nums text-[11px]">{post.likes}</span>
            </button>

            <div className="flex items-center gap-1 text-slate-500">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums text-[11px]">{post.comments.length}</span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all ml-0.5" />
          </div>
        </div>
      </div>
    </article>
  );
};
