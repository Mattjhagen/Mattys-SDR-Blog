import React, { useState } from 'react';
import { BlogPost, CommentItem } from '../types/blog';
import { ArrowLeft, Heart, MessageSquare, Play, Square, Share2, Printer, MapPin, Radio, Send, Check } from 'lucide-react';
import { morsePlayer } from '../utils/morseAudio';

interface PostDetailViewProps {
  post: BlogPost;
  onBack: () => void;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, comment: Omit<CommentItem, 'id' | 'timestamp'>) => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  post,
  onBack,
  onLike,
  onAddComment
}) => {
  const [isPlayingMorse, setIsPlayingMorse] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [commentCallsign, setCommentCallsign] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentRst, setCommentRst] = useState('599');
  const [commentMessage, setCommentMessage] = useState('');

  const handleToggleMorse = () => {
    if (isPlayingMorse) {
      morsePlayer.stop();
      setIsPlayingMorse(false);
      return;
    }
    setIsPlayingMorse(true);
    morsePlayer.play(post.authorCallsign, 20, 650, undefined, () => {
      setIsPlayingMorse(false);
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentCallsign.trim() || !commentMessage.trim()) return;

    onAddComment(post.id, {
      callsign: commentCallsign.trim().toUpperCase(),
      name: commentName.trim() || 'Club Member',
      rstReport: commentRst.trim() || undefined,
      message: commentMessage.trim()
    });

    setCommentMessage('');
  };

  // Basic Markdown Renderer for article content (headers, tables, code blocks, lists, quotes)
  const renderMarkdownContent = (raw: string) => {
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let inTable = false;
    let tableBuffer: string[] = [];

    const flushTable = (idx: number) => {
      if (tableBuffer.length === 0) return null;
      const rows = tableBuffer.map((r) =>
        r
          .split('|')
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          .map((c) => c.trim())
      );
      tableBuffer = [];
      const header = rows[0];
      const dataRows = rows.slice(2); // Skip separator row

      return (
        <div key={`table-${idx}`} className="my-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-300">
              <tr>
                {header.map((th, hIdx) => (
                  <th key={hIdx} className="px-4 py-2.5 font-semibold">
                    {th.replace(/\*\*/g, '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-slate-300 tabular-nums">
                      {cell.replace(/\*\*/g, '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${index}`}
              className="my-5 p-4 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed"
            >
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        return;
      } else if (inTable) {
        elements.push(flushTable(index));
        inTable = false;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="font-display text-2xl font-bold text-white mt-8 mb-4">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="font-display text-lg font-semibold text-amber-300 mt-6 mb-3">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={index}
            className="my-4 pl-4 border-l-2 border-amber-400 text-sm italic text-slate-300 bg-amber-500/5 py-2 pr-3 rounded-r-lg"
          >
            {line.replace('> ', '')}
          </blockquote>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={index} className="ml-5 list-disc text-sm text-slate-300 my-1 leading-relaxed">
            {line.replace('- ', '')}
          </li>
        );
      } else if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={index} className="ml-5 list-decimal text-sm text-slate-300 my-1 leading-relaxed">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      } else if (line.trim() === '---') {
        elements.push(<hr key={index} className="my-8 border-slate-800" />);
      } else if (line.trim()) {
        elements.push(
          <p key={index} className="text-sm leading-relaxed text-slate-300 my-3">
            {line}
          </p>
        );
      }
    });

    if (inTable) {
      elements.push(flushTable(lines.length));
    }

    return elements;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Back Button & Share Bar */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold font-mono text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO FIELD LOGS</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Article Header */}
      <header className="space-y-4">
        {/* Zero-Pill Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="text-amber-400 font-semibold">{post.category}</span>
          <span aria-hidden="true">·</span>
          <span>{post.publishedAt}</span>
          <span aria-hidden="true">·</span>
          <span>{post.readTimeMinutes} min read</span>
          <span aria-hidden="true">·</span>
          <span>BAND: {post.band}</span>
          <span aria-hidden="true">·</span>
          <span>GRID: {post.qthGrid}</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          {post.title}
        </h1>

        {/* Lead Excerpt */}
        <p className="text-base text-slate-300 leading-relaxed max-w-3xl">
          {post.excerpt}
        </p>

        {/* Author Bio Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMorse}
              title={`Play ${post.authorCallsign} in CW`}
              className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
            >
              {isPlayingMorse ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current text-amber-300" />
                  <span>Stop CW</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Key CW</span>
                </>
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white tracking-wide">
                  {post.authorCallsign}
                </span>
                <span className="text-xs text-slate-400">· {post.authorName}</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>QTH: {post.authorQth} ({post.qthGrid})</span>
              </div>
            </div>
          </div>

          {/* Social Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLike(post.id)}
              className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-rose-500/40 text-slate-200 text-xs flex items-center gap-2 transition-colors"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="font-mono tabular-nums font-semibold">{post.likes}</span>
              <span>Kudos</span>
            </button>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      {post.coverImage && (
        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9]">
          <img
            src={post.coverImage}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Rig & Equipment Callout Box */}
      {post.rigEquipment && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-mono text-slate-400 block mb-0.5">STATION GEAR CHAIN</span>
            <span className="text-slate-200 font-medium text-sm">{post.rigEquipment}</span>
          </div>
        </div>
      )}

      {/* Main Prose Content */}
      <article className="prose prose-invert max-w-none text-slate-300">
        {renderMarkdownContent(post.content)}
      </article>

      {/* Tag List */}
      <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="font-mono text-slate-500">TAGS:</span>
        {post.tags.map((tag) => (
          <span key={tag} className="text-slate-300 font-mono">
            #{tag}
          </span>
        ))}
      </div>

      {/* Club Comments & QSL Reports Section */}
      <section className="pt-8 border-t border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="font-display text-xl font-bold text-white">
              Club Member Remarks & QSL Reports
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {post.comments.length} check-ins
          </span>
        </div>

        {/* Existing Comments */}
        <div className="space-y-3">
          {post.comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400">
                    {comment.callsign}
                  </span>
                  <span className="text-slate-400 font-medium">({comment.name})</span>
                  {comment.rstReport && (
                    <span className="text-slate-500 font-mono">
                      · RST: <strong className="text-white">{comment.rstReport}</strong>
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {comment.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {comment.message}
              </p>
            </div>
          ))}

          {post.comments.length === 0 && (
            <p className="text-xs text-slate-500 py-4 text-center">
              No comments yet. Be the first club member to log your 73 or ask a technical question!
            </p>
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-300 tracking-wider">
            SUBMIT ON-AIR REMARK / 73 LOG
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                YOUR CALLSIGN *
              </label>
              <input
                type="text"
                required
                value={commentCallsign}
                onChange={(e) => setCommentCallsign(e.target.value.toUpperCase())}
                placeholder="e.g. K7NVH"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-300 uppercase focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                NAME / OPERATOR
              </label>
              <input
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="e.g. Dave Henderson"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                SIGNAL REPORT (RST)
              </label>
              <input
                type="text"
                value={commentRst}
                onChange={(e) => setCommentRst(e.target.value)}
                placeholder="599"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              REMARK / TECHNICAL NOTE *
            </label>
            <textarea
              required
              rows={3}
              value={commentMessage}
              onChange={(e) => setCommentMessage(e.target.value)}
              placeholder="Leave feedback on antenna SWR, ask a question, or send 73..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post to Club Log</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
