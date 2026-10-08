/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BlogPost, BlogCategory, CommentItem, ContactedHam } from './types/blog';
import { INITIAL_POSTS, INITIAL_CONTACTS } from './data/initialPosts';
import { TopNavigation, NavigationTab } from './components/TopNavigation';
import { HeroBanner } from './components/HeroBanner';
import { PostCard } from './components/PostCard';
import { PostDetailView } from './components/PostDetailView';
import { PostEditorModal } from './components/PostEditorModal';
import { BlogArchiveView } from './components/BlogArchiveView';
import { ContactLogbookMap } from './components/ContactLogbookMap';
import { SdrWaterfallLab } from './components/SdrWaterfallLab';
import { SolarWidget } from './components/SolarWidget';
import { MorseToolModal } from './components/MorseToolModal';
import { GridCalculatorModal } from './components/GridCalculatorModal';
import { ClubScheduleModal } from './components/ClubScheduleModal';
import { TwoFactorAuth } from './components/TwoFactorAuth';
import { VisitorLog } from './components/VisitorLog';
import { Search, Radio, Filter, Plus, Calendar, Compass, Volume2, Sparkles, Archive, Globe } from 'lucide-react';

const POSTS_STORAGE_KEY = 'ham_radio_journal_posts_v3';
const CONTACTS_STORAGE_KEY = 'ham_radio_journal_contacts_v3';
const AUTH_SESSION_KEY = 'ham_radio_admin_session_v1';

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
      // Purge any legacy storage keys that held mock posts
      localStorage.removeItem('ham_radio_sdr_blog_posts_v1');
      localStorage.removeItem('ham_radio_sdr_blog_posts_v2');

      const stored = localStorage.getItem(POSTS_STORAGE_KEY);
      if (stored) {
        const parsed: BlogPost[] = JSON.parse(stored);
        // Ensure no legacy mock posts persist
        const mockPostIds = ['post-1', 'post-2', 'post-3', 'post-4'];
        return parsed.filter((p) => !mockPostIds.includes(p.id));
      }
    } catch (e) {
      console.error('Failed to load posts from storage:', e);
    }
    return INITIAL_POSTS;
  });

  const [contacts, setContacts] = useState<ContactedHam[]>(() => {
    try {
      // Purge any legacy storage keys that held mock contacts
      localStorage.removeItem('ham_radio_contacted_hams_v1');
      localStorage.removeItem('ham_radio_contacted_hams_v2');

      const stored = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (stored) {
        const parsed: ContactedHam[] = JSON.parse(stored);
        // Ensure no legacy mock contacts persist
        const mockContactIds = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'contact-1'];
        return parsed.filter((c) => !mockContactIds.includes(c.id));
      }
    } catch (e) {
      console.error('Failed to load contacts from storage:', e);
    }
    return INITIAL_CONTACTS;
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('posts');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMorseOpen, setIsMorseOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [isClubNetsOpen, setIsClubNetsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const session = localStorage.getItem(AUTH_SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        // Session valid for 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to load auth session:', e);
    }
    return false;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error('Failed to save posts to storage:', e);
    }
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    } catch (e) {
      console.error('Failed to save contacts to storage:', e);
    }
  }, [contacts]);

  // Compute all unique tags across posts
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [posts]);

  // Handle post selection
  const handleSelectPost = (post: BlogPost) => {
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPosts = () => {
    setSelectedPost(null);
  };

  const handleSelectCategory = (cat: BlogCategory) => {
    setSelectedCategory(cat);
    setActiveTab('posts');
    setSelectedPost(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setActiveTab('posts');
    setSelectedPost(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Handle Comments (with name, optional email, optional callsign, RST, and message)
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

  // Handle Save New or Edited Post
  const handleSavePost = (savedPost: BlogPost) => {
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === savedPost.id);
      if (exists) {
        return prev.map((p) => (p.id === savedPost.id ? savedPost : p));
      }
      return [savedPost, ...prev];
    });

    setActiveTab('posts');
    setSelectedPost(savedPost);
    setEditingPost(null);
  };

  // Handle Add New Contact to Logbook
  const handleAddContact = (newContact: ContactedHam) => {
    setContacts((prev) => [newContact, ...prev]);
  };

  // Handle Edit Post Trigger
  const handleOpenEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  // Handle 2FA Authentication Success
  const handle2FASuccess = () => {
    try {
      // Set session
      const session = {
        timestamp: Date.now()
      };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      setIsLoginOpen(false);

      // Now open the editor
      setEditingPost(null);
      setIsEditorOpen(true);
    } catch (e) {
      console.error('Authentication failed:', e);
    }
  };

  // Handle Open Create New Post (requires 2FA authentication)
  const handleOpenNewPost = () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
    } else {
      setEditingPost(null);
      setIsEditorOpen(true);
    }
  };

  // Handle Export Data (ADIF-ready format)
  const handleExportData = () => {
    const callsign = import.meta.env.VITE_HAM_CALLSIGN || 'SWL';
    const grid = import.meta.env.VITE_MAIDENHEAD_GRID || 'EN09xv';

    const exportBundle = {
      exportDate: new Date().toISOString(),
      station: {
        callsign,
        grid,
        mode: 'SWL',
        status: 'Studying for Technician License'
      },
      posts,
      contacts
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `swl_logbook_${grid}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Removed handleClearAllData - not needed in SWL mode
  // Users can export/backup but clearing all data is destructive

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
          setSelectedPost(null);
        }}
        onOpenNewPost={handleOpenNewPost}
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
            onSelectCategory={handleSelectCategory}
            onSelectTag={handleSelectTag}
            onEditPost={handleOpenEditPost}
          />
        ) : activeTab === 'archive' ? (
          /* VIEW 2: CHRONOLOGICAL ARCHIVE PAGE */
          <BlogArchiveView
            posts={posts}
            onSelectPost={handleSelectPost}
            onSelectCategory={handleSelectCategory}
            onOpenNewPost={handleOpenNewPost}
          />
        ) : activeTab === 'map' ? (
          /* VIEW 3: QSO MAP & CONTACTED HAMS DIRECTORY */
          <ContactLogbookMap
            contacts={contacts}
            posts={posts}
            onAddContact={handleAddContact}
            onSelectPost={handleSelectPost}
          />
        ) : activeTab === 'waterfall' ? (
          /* VIEW 4: SDR WATERFALL LAB */
          <SdrWaterfallLab />
        ) : activeTab === 'propagation' ? (
          /* VIEW 5: SOLAR & BAND PROPAGATION */
          <SolarWidget />
        ) : activeTab === 'nets' ? (
          /* VIEW 6: CLUB NETS INLINE */
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
        ) : activeTab === 'visitor-log' ? (
          /* VIEW 7: VISITOR GUESTBOOK */
          <VisitorLog />
        ) : (
          /* VIEW 8: BLOG ADVENTURES DIRECTORY */
          <div className="space-y-8">
            {/* Editorial Hero Banner */}
            <HeroBanner
              onOpenWaterfall={() => setActiveTab('waterfall')}
              onOpenNets={() => setActiveTab('nets')}
              onOpenNewPost={handleOpenNewPost}
              postCount={posts.length}
              contactCount={contacts.length}
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
                    placeholder="Search logs by keyword, band, tag, callsign (e.g. W7SDR), or grid..."
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

                {/* Quick Navigation Tool Shortcuts */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('archive')}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Archive</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                    aria-label={`QSO Map${contacts.length > 0 ? ` (${contacts.length} contacts)` : ''}`}
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>QSO Map{contacts.length > 0 ? ` (${contacts.length})` : ''}</span>
                  </button>
                  <button
                    onClick={() => setIsMorseOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>CW Keyer</span>
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

              {/* Tag Cloud Filter Bar - Only show if tags exist */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-mono">
                  <span className="text-slate-500 text-[11px] mr-1">TAGS:</span>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`px-2.5 py-1 rounded-md text-[11px] transition-colors border ${
                        selectedTag === tag
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

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
                    onSelectCategory={handleSelectCategory}
                    onSelectTag={handleSelectTag}
                    onEditPost={handleOpenEditPost}
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="p-12 sm:p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Radio className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  No Listens Logged Yet
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your SWL journal is ready! Log your first shortwave catch - try monitoring WWV on 10 MHz, a local FM repeater, or NOAA weather satellites. Document your learning journey toward that Technician license.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={handleOpenNewPost}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
                    aria-label="Log your first listen"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Log First Listen</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <Radio className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-display text-lg font-semibold text-white">
                  No Entries Found
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No journal entries matched your active category or search query. Try clearing filters or log a new listen!
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                      setSelectedTag(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                    aria-label="Clear all filters"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Top row - Station info and links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-mono">
              <Radio className="w-4 h-4 text-amber-400/80" />
              <span>
                Callsign: <strong className="text-white">{import.meta.env.VITE_HAM_CALLSIGN || 'Pending (Studying)'}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                {import.meta.env.VITE_CLUB_NAME || 'Ak-Sar-Ben ARC'}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Grid: <strong className="text-amber-400">{import.meta.env.VITE_MAIDENHEAD_GRID || 'EN09xv'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <button
                onClick={() => {
                  setActiveTab('archive');
                  setSelectedPost(null);
                }}
                className="hover:text-slate-300 transition-colors"
              >
                Archive
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => {
                  setActiveTab('visitor-log');
                  setSelectedPost(null);
                }}
                className="hover:text-slate-300 transition-colors"
              >
                Guestbook
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={handleExportData}
                className="hover:text-slate-300 transition-colors"
                aria-label="Export logbook as ADIF"
              >
                Export ADIF
              </button>
            </div>
          </div>

          {/* Bottom row - SWL Disclaimer */}
          <div className="text-center pt-3 border-t border-slate-800/50">
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl mx-auto">
              <strong className="text-amber-400/80">SWL RECEIVE-ONLY MODE:</strong> This is a shortwave listening journal documenting receive-only activities.
              Operator is <strong>not yet licensed</strong> and studying for Amateur Radio Technician exam.
              No transmissions are made. No remote transmit capability. RTL-SDR receive equipment on order.
            </p>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <PostEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPost(null);
        }}
        onSave={handleSavePost}
        existingPost={editingPost}
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

      <TwoFactorAuth
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onAuthenticated={handle2FASuccess}
      />
    </div>
  );
}
