"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Eye, MessageCircle, Plus, Search, Send, ThumbsUp, X } from "lucide-react";
import { problemDiscussions, type ProblemDiscussion } from "@/data/problem-discussions";

type DiscussionSort = "popular" | "newest" | "unanswered";

export function DiscussionPanel({ problemTitle }: { problemTitle: string }) {
  const [items, setItems] = useState(problemDiscussions);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<DiscussionSort>("popular");
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [voted, setVoted] = useState(() => new Set<string>());

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...items]
      .filter((item) => !normalized || `${item.title} ${item.content} ${item.tags.join(" ")}`.toLowerCase().includes(normalized))
      .filter((item) => sort !== "unanswered" || item.replies === 0)
      .sort((left, right) => sort === "newest" ? right.id.localeCompare(left.id) : right.votes - left.votes);
  }, [items, query, sort]);

  function toggleVote(id: string) {
    const isVoted = voted.has(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, votes: item.votes + (isVoted ? -1 : 1) } : item));
    setVoted((current) => {
      const next = new Set(current);
      if (isVoted) next.delete(id); else next.add(id);
      return next;
    });
  }

  function publish() {
    if (!draftTitle.trim() || !draftContent.trim()) return;
    const discussion: ProblemDiscussion = {
      id: `discussion-${Date.now()}`,
      author: "Nguyễn Trần Gia Sĩ",
      initials: "GS",
      role: "Người học",
      postedAt: "Vừa xong",
      title: draftTitle.trim(),
      content: draftContent.trim(),
      tags: ["Thảo luận mới"],
      votes: 0,
      replies: 0,
      solved: false,
    };
    setItems((current) => [discussion, ...current]);
    setDraftTitle("");
    setDraftContent("");
    setComposerOpen(false);
    setSort("newest");
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Search, sort and compose share one row — the pane is narrow, so a title plus a
       * subtitle above them cost more vertical space than the first discussion. */}
      <div className="border-b border-border-soft p-3">
        <div className="flex items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-bg px-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm trong thảo luận..."
              className="h-8 min-w-0 flex-1 bg-transparent text-xs text-navy outline-none placeholder:text-text-faint"
            />
          </label>
          <div className="relative shrink-0">
            <select
              aria-label="Sắp xếp thảo luận"
              value={sort}
              onChange={(event) => setSort(event.target.value as DiscussionSort)}
              className="h-8 appearance-none rounded-md border border-border bg-surface pr-7 pl-2.5 text-xs font-semibold text-navy outline-none"
            >
              <option value="popular">Nổi bật</option>
              <option value="newest">Mới nhất</option>
              <option value="unanswered">Chưa trả lời</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-text-faint" />
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen((value) => !value)}
            title={composerOpen ? "Đóng" : "Tạo thảo luận"}
            aria-label={composerOpen ? "Đóng soạn thảo luận" : "Tạo thảo luận"}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
              composerOpen ? "bg-navy text-on-ink" : "border border-border text-text-muted hover:bg-bg hover:text-navy"
            }`}
          >
            {composerOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
        {composerOpen && <div className="mt-2 rounded-lg border border-border bg-bg p-3"><input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Tiêu đề câu hỏi hoặc chia sẻ" className="h-9 w-full border-0 bg-transparent text-sm font-semibold text-navy outline-none placeholder:font-normal placeholder:text-text-faint" /><textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} placeholder="Mô tả cách bạn đang suy nghĩ, lỗi gặp phải hoặc test case cần trao đổi..." className="mt-2 min-h-24 w-full resize-none border-t border-border-soft bg-transparent pt-3 text-sm leading-6 text-text outline-none placeholder:text-text-faint" /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-[11px] text-text-faint">Hãy dùng code block nếu cần chia sẻ đoạn mã ngắn.</span><button type="button" disabled={!draftTitle.trim() || !draftContent.trim()} onClick={publish} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-on-ink disabled:opacity-40"><Send className="h-3.5 w-3.5" /> Đăng bài</button></div></div>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.length > 0 ? <div className="divide-y divide-border-soft">{visible.map((item) => <article key={item.id} className="p-4 transition hover:bg-bg/60"><div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-on-ink">{item.initials}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-faint"><b className="text-xs text-navy">{item.author}</b><span>{item.role}</span><span>·</span><span>{item.postedAt}</span>{item.solved && <span className="inline-flex items-center gap-1 font-semibold text-primary"><CheckCircle2 className="h-3 w-3" /> Đã giải</span>}</div><h3 className="mt-2 text-sm font-bold leading-5 text-navy">{item.title}</h3><p className="mt-1.5 text-xs leading-5 text-text-muted">{item.content}</p>{item.code && <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-ink-fixed p-3 text-[11px] leading-5 text-zinc-200"><code>{item.code}</code></pre>}<div className="mt-3 flex flex-wrap gap-1.5">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-border-soft px-2 py-1 text-[10px] font-medium text-text-muted">{tag}</span>)}{item.language && <span className="rounded-full bg-primary-tint px-2 py-1 text-[10px] font-medium text-primary">{item.language}</span>}</div><div className="mt-3 flex items-center gap-4 text-[11px] text-text-faint"><button type="button" onClick={() => toggleVote(item.id)} className={`inline-flex items-center gap-1.5 font-semibold ${voted.has(item.id) ? "text-primary" : "hover:text-navy"}`}><ThumbsUp className="h-3.5 w-3.5" /> {item.votes}</button><button type="button" className="inline-flex items-center gap-1.5 hover:text-navy"><MessageCircle className="h-3.5 w-3.5" /> {item.replies} trả lời</button><span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {item.votes * 17 + 120}</span></div></div></div></article>)}</div> : <div className="flex h-full min-h-52 flex-col items-center justify-center p-8 text-center"><MessageCircle className="h-7 w-7 text-text-faint" /><p className="mt-3 text-sm font-semibold text-navy">Chưa có thảo luận phù hợp</p><p className="mt-1 text-xs text-text-muted">Hãy đổi bộ lọc hoặc bắt đầu một chủ đề mới.</p></div>}
      </div>
    </div>
  );
}
