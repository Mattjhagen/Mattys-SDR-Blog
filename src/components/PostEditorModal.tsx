import React, { useState } from 'react';
import { BlogPost, BlogCategory } from '../types/blog';
import { X, Radio, Image as ImageIcon, Code, Eye, FileText, Check } from 'lucide-react';

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: BlogPost) => void;
  existingPost?: BlogPost | null;
}

const STOCK_IMAGES = [
  { label: 'SDR Shack & Lab', path: '/src/assets/images/hero_ham_shack_1791391157714.jpg' },
  { label: 'POTA Portable Field', path: '/src/assets/images/article_qrp_pota_1791391169211.jpg' },
  { label: 'Weather Satellite QFH', path: '/src/assets/images/article_noaa_apt_1791391179875.jpg' },
  { label: 'Backyard Mag Loop', path: '/src/assets/images/article_hf_magloop_1791391189393.jpg' }
];

export const PostEditorModal: React.FC<PostEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingPost
}) => {
  const [title, setTitle] = useState(existingPost?.title || '');
  const [excerpt, setExcerpt] = useState(existingPost?.excerpt || '');
  const [content, setContent] = useState(
    existingPost?.content ||
      `## Adventure Overview\nWrite about your radio setup, operating conditions, and what you heard or worked on air today.\n\n### Signal Chain & Rig\n- **Receiver/Rig**: \n- **Antenna**: \n- **Conditions**: \n\n### Key Takeaways\n- `
  );
  const [category, setCategory] = useState<Exclude<BlogCategory, 'All'>>(
    existingPost?.category || 'SDR & DSP'
  );
  const [band, setBand] = useState(existingPost?.band || '20m (14 MHz)');
  const [qthGrid, setQthGrid] = useState(existingPost?.qthGrid || 'CN87us');
  const [rigEquipment, setRigEquipment] = useState(
    existingPost?.rigEquipment || 'RTL-SDR Blog v4 · End-Fed Half Wave (EFHW)'
  );
  const [authorCallsign, setAuthorCallsign] = useState(
    existingPost?.authorCallsign || 'W7SDR'
  );
  const [authorName, setAuthorName] = useState(
    existingPost?.authorName || 'Matt Hagen'
  );
  const [authorQth, setAuthorQth] = useState(
    existingPost?.authorQth || 'Puget Sound, WA'
  );
  const [coverImage, setCoverImage] = useState(
    existingPost?.coverImage || STOCK_IMAGES[0].path
  );
  const [tagsStr, setTagsStr] = useState(
    existingPost?.tags ? existingPost.tags.join(', ') : 'SDR, Ham Radio, Field Log'
  );
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  if (!isOpen) return null;

  const handleInsertTemplate = (type: 'qso' | 'diagram' | 'antenna') => {
    let snippet = '';
    if (type === 'qso') {
      snippet = `\n### Selected QSO Log Table\n| Time (UTC) | Callsign | Band | Mode | RST Sent | RST Rcvd | QTH Notes |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| 18:22 | W7HAM | 20m | CW | 599 | 599 | Local club contact |\n| 18:45 | JA1ABC | 20m | CW | 579 | 559 | Tokyo, Japan DX |\n\n`;
    } else if (type === 'diagram') {
      snippet = `\n\`\`\`\n[Antenna / Feedline]\n       │\n       ▼\n[Bandpass Filter / LNA]\n       │\n       ▼\n[SDR Receiver (USB)] ──> [Laptop / DSP Software]\n\`\`\`\n\n`;
    } else if (type === 'antenna') {
      snippet = `\n### Antenna Build Specifications\n- **Resonant Frequency**: 14.150 MHz (SWR 1.15:1)\n- **Wire Length**: 33.2 feet 14 AWG copper\n- **Height Above Ground**: 25 feet inverted-V\n- **Balun**: 49:1 autotransformer on Fair-Rite FT240-43\n\n`;
    }
    setContent((prev) => prev + snippet);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const wordCount = content.split(/\s+/).length;
    const readTimeMinutes = Math.max(2, Math.ceil(wordCount / 180));

    const newPost: BlogPost = {
      id: existingPost?.id || `post-${Date.now()}`,
      slug:
        existingPost?.slug ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      title: title.trim(),
      excerpt: excerpt.trim() || content.slice(0, 150).replace(/[#*`]/g, '') + '...',
      content: content.trim(),
      authorCallsign: authorCallsign.trim().toUpperCase(),
      authorName: authorName.trim(),
      authorQth: authorQth.trim(),
      publishedAt: existingPost?.publishedAt || new Date().toISOString().split('T')[0],
      readTimeMinutes,
      category,
      band: band.trim(),
      qthGrid: qthGrid.trim().toUpperCase(),
      rigEquipment: rigEquipment.trim(),
      coverImage: coverImage.trim(),
      tags: tags.length ? tags : ['Ham Radio'],
      likes: existingPost?.likes || 0,
      comments: existingPost?.comments || []
    };

    onSave(newPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight text-white">
                {existingPost ? 'Edit Adventure Transmission' : 'New Adventure Transmission'}
              </h3>
              <p className="text-xs text-slate-400">
                Log SDR experiments, field activations, and antenna builds for club members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Post Title */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              POST TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pulling Meteor-M2 Weather Satellite Imagery with HackRF & LNA"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-semibold text-base focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Metadata Row: Category, Band, Grid Square */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<BlogCategory, 'All'>)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-amber-300 focus:outline-none focus:border-amber-400"
              >
                <option value="SDR & DSP">SDR & DSP</option>
                <option value="HF & DX Field">HF & DX Field</option>
                <option value="Antenna Builds">Antenna Builds</option>
                <option value="Satellites & Space">Satellites & Space</option>
                <option value="Digital & FT8">Digital & FT8</option>
                <option value="Club Events & Nets">Club Events & Nets</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                BAND / FREQUENCY
              </label>
              <input
                type="text"
                value={band}
                onChange={(e) => setBand(e.target.value)}
                placeholder="e.g. 20m (14.074 MHz)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                GRID SQUARE (QTH)
              </label>
              <input
                type="text"
                value={qthGrid}
                onChange={(e) => setQthGrid(e.target.value.toUpperCase())}
                placeholder="e.g. CN87us"
                maxLength={6}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-300 uppercase focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Author info & Rig */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                OPERATOR CALLSIGN *
              </label>
              <input
                type="text"
                required
                value={authorCallsign}
                onChange={(e) => setAuthorCallsign(e.target.value.toUpperCase())}
                placeholder="W7SDR"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-400 mb-1">
                GEAR CHAIN / RIG DETAILS
              </label>
              <input
                type="text"
                value={rigEquipment}
                onChange={(e) => setRigEquipment(e.target.value)}
                placeholder="e.g. Icom IC-705 (5W) · Chameleon MPAS 2.0 Vertical"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              SHORT SUMMARY / EXCERPT
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="1-2 sentences summarizing the expedition or experiment..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Cover Image Selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              CHOOSE COVER IMAGE
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STOCK_IMAGES.map((img) => (
                <button
                  type="button"
                  key={img.path}
                  onClick={() => setCoverImage(img.path)}
                  className={`relative rounded-lg overflow-hidden border aspect-[4/3] text-left transition-all ${
                    coverImage === img.path
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.path}
                    alt={img.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5 text-[10px] text-white font-medium">
                    {img.label}
                  </div>
                  {coverImage === img.path && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Markdown Content Field with Helpers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-mono text-slate-400">
                  FULL ARTICLE CONTENT (MARKDOWN) *
                </label>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('edit')}
                    className={`px-2 py-0.5 rounded ${
                      previewTab === 'edit'
                        ? 'bg-slate-800 text-amber-300 font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('preview')}
                    className={`px-2 py-0.5 rounded ${
                      previewTab === 'preview'
                        ? 'bg-slate-800 text-amber-300 font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Template Quick Insertion */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span>Insert:</span>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('qso')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  + QSO Log
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('diagram')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  + Signal Chain
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTemplate('antenna')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  + Antenna Specs
                </button>
              </div>
            </div>

            {previewTab === 'edit' ? (
              <textarea
                required
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-amber-400"
                placeholder="Write article in markdown..."
              />
            ) : (
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg min-h-[200px] text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                {content}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              TAGS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="SDR, 20m, POTA, CW, Antenna Build"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-sm"
            >
              Publish Transmission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
