/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory, CommentItem } from './types/blog';
import { INITIAL_POSTS } from './data/initialPosts';
import { TopNavigation } from './components/TopNavigation';
import { HeroBanner } from './components/HeroBanner';
import { PostCard } from './components/PostCard';
import { PostDetailView } from './components/PostDetailView';
import { PostEditorModal } from './components/PostEditorModal';
import { SdrWaterfallLab } from './components/SdrWaterfallLab';
import { SolarWidget } from './components/SolarWidget';
import { MorseToolModal } from './components/MorseToolModal';
import { GridCalculatorModal } from './components/GridCalculatorModal';
import { ClubScheduleModal } from './components/ClubScheduleModal';
import { Search, Radio, Filter, Plus, Calendar, Compass, Volume2, Sparkles, RefreshCcw } from 'lucide-react';

const STORAGE_KEY = 'ham_radio_sdr_blog_posts_v1';

const CATEGORIES: BlogCategory[] = [
  'All',
  'SDR & DSP',
  'HF & DX Field',
  'Antenna Builds',
  'Satellites & Space',
  'Digital & FT8',
  'Club Events & Nets'
];

export default function App() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load posts from storage:', e);
    }
    return INITIAL_POSTS;
  });

  const [activeTab, setActiveTab] = useState<'posts' | 'waterfall' | 'propagation' | 'nets'>('posts');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMorseOpen, setIsMorseOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [isClubNetsOpen, setIsClubNetsOpen] = useState(false);

  // Save to localStorage whenever posts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error('Failed to save posts to storage:', e);
    }
  }, [posts]);

  // Handle post selection
  const handleSelectPost = (post: BlogPost) => {
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPosts = () => {
    setSelectedPost(null);
  };

  // Handle Likes
  const handleLike = (e: React.MouseEvent | null, postId: string) => {
    if (e) e.stopPropagation();
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null));
    }
  };

  // Handle Comments
  const handleAddComment = (
    postId: string,
    newComment: Omit<CommentItem, 'id' | 'timestamp'>
  ) => {
    const commentWithMeta: CommentItem = {
      ...newComment,
      id: `comment-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [commentWithMeta, ...p.comments] }
          : p
      )
    );

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              comments: [commentWithMeta, ...prev.comments]
            }
          : null
      );
    }
  };

  // Handle Save New Post
  const handleSavePost = (newPost: BlogPost) => {
    setPosts((prev) => [newPost, ...prev]);
    // Switch to posts view and open the new post
    setActiveTab('posts');
    setSelectedPost(newPost);
  };

  // Handle Export Data
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(posts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ham_radio_sdr_blog_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Reset to Default Posts
  const handleResetDefaults = () => {
    if (window.confirm('Reset all posts to default club field logs?')) {
      setPosts(INITIAL_POSTS);
      setSelectedPost(null);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    if (selectedCategory !== 'All' && post.category !== selectedCategory) {
      return false;
    }
    if (selectedTag && !post.tags.includes(selectedTag)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchExcerpt = post.excerpt.toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      const matchCall = post.authorCallsign.toLowerCase().includes(q);
      const matchBand = post.band.toLowerCase().includes(q);
      const matchGrid = post.qthGrid.toLowerCase().includes(q);
      const matchTag = post.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchExcerpt && !matchContent && !matchCall && !matchBand && !matchGrid && !matchTag) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Bar Contract Compliant Header */}
      <TopNavigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'posts') setSelectedPost(null);
        }}
        onOpenNewPost={() => setIsEditorOpen(true)}
        onOpenMorseModal={() => setIsMorseOpen(true)}
        onOpenGridModal={() => setIsGridOpen(true)}
        onExportData={handleExportData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW 1: POST DETAIL VIEW */}
        {selectedPost ? (
          <PostDetailView
            post={selectedPost}
            onBack={handleBackToPosts}
            onLike={(id) => handleLike(null, id)}
            onAddComment={handleAddComment}
          />
        ) : activeTab === 'waterfall' ? (
          /* VIEW 2: SDR WATERFALL LAB */
          <SdrWaterfallLab />
        ) : activeTab === 'propagation' ? (
          /* VIEW 3: SOLAR & BAND PROPAGATION */
          <SolarWidget />
        ) : activeTab === 'nets' ? (
          /* VIEW 4: CLUB NETS INLINE */
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>VALLEY AMATEUR RADIO CLUB ON-AIR NETS</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Weekly Club Nets & Field Meetups
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Join our Thursday 2m VHF check-in net, 10m ragchew roundtable, and ARES emergency preparedness drills.
              </p>
            </div>
            <ClubScheduleModal isOpen={true} onClose={() => setActiveTab('posts')} />
          </div>
        ) : (
          /* VIEW 5: BLOG ADVENTURES DIRECTORY */
          <div className="space-y-8">
            {/* Editorial Hero Banner */}
            <HeroBanner
              onOpenWaterfall={() => setActiveTab('waterfall')}
              onOpenNets={() => setActiveTab('nets')}
              onOpenNewPost={() => setIsEditorOpen(true)}
              postCount={posts.length}
            />

            {/* Filter & Search Bar */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by keyword, band, callsign (e.g. W7SDR), or grid..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Interactive Tool Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMorseOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>CW Keyer</span>
                  </button>
                  <button
                    onClick={() => setIsGridOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>QTH Calc</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('propagation')}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Solar SFI</span>
                  </button>
                </div>
              </div>

              {/* Interactive Category Filter Segmented Controls */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-x-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Active Filter Indicators (if any) */}
              {(selectedTag || searchQuery || selectedCategory !== 'All') && (
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                  <div className="flex items-center gap-2">
                    <span>Active Filters:</span>
                    {selectedCategory !== 'All' && (
                      <span className="text-amber-300 font-semibold">{selectedCategory}</span>
                    )}
                    {selectedTag && (
                      <span className="text-amber-300">
                        #{selectedTag}{' '}
                        <button
                          onClick={() => setSelectedTag(null)}
                          className="text-slate-500 hover:text-white ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="text-amber-300">"{searchQuery}"</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedTag(null);
                      setSearchQuery('');
                    }}
                    className="text-slate-500 hover:text-slate-300 underline"
                  >
                    Reset all
                  </button>
                </div>
              )}
            </div>

            {/* Post Grid (Desktop 3-column / Tablet 2-column) */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onSelect={handleSelectPost}
                    onLike={handleLike}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <Radio className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-display text-lg font-semibold text-white">
                  No Transmissions Found
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No journal logs matched your active category or search query. Try clearing filters or write a new transmission!
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                      setSelectedTag(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400/80" />
            <span className="font-mono text-slate-400">
              73 DE W7SDR · Valley Amateur Radio Club · Grid CN87us
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExportData}
              className="hover:text-slate-300 transition-colors"
            >
              Export Journal (JSON)
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleResetDefaults}
              className="hover:text-slate-300 transition-colors"
            >
              Reset Demo Posts
            </button>
            <span aria-hidden="true">·</span>
            <span>All amateur frequencies documented for educational club use</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <PostEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSavePost}
      />

      <MorseToolModal
        isOpen={isMorseOpen}
        onClose={() => setIsMorseOpen(false)}
      />

      <GridCalculatorModal
        isOpen={isGridOpen}
        onClose={() => setIsGridOpen(false)}
      />

      <ClubScheduleModal
        isOpen={isClubNetsOpen}
        onClose={() => setIsClubNetsOpen(false)}
      />
    </div>
  );
}
