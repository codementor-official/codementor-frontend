"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@codementor/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { WorkspaceListItem } from "../types";
import { WorkspaceMiniChat } from "./workspace-chat";
import { useWorkspaceChat } from "./use-workspace-chat";
import { MINI_CHAT_SETTING_CHANGED, announceMiniChatSetting } from "./mini-chat-preference";

const LAST_WORKSPACE_KEY = "codementor:mini-chat-workspace";

export function WorkspaceChatLauncher() {
  const { status, user } = useAuth();
  const toast = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || !user?.id) return;
    let active = true;
    void Promise.all([
      api.account.settings(),
      loadMyWorkspaces(),
    ]).then(([settings, workspaceItems]) => {
      if (!active) return;
      const groups = workspaceItems.filter((workspace) => workspace.role !== null);
      const stored = window.localStorage.getItem(LAST_WORKSPACE_KEY);
      const initial = groups.find((item) => item.slug === stored)?.slug
        ?? groups[0]?.slug
        ?? "";
      setEnabled(settings.miniChatEnabled !== false);
      setWorkspaces(groups);
      setSelectedSlug(initial);
      setLoadedUserId(user.id);
    }).catch(() => {
      if (!active) return;
      setEnabled(false);
      setWorkspaces([]);
      setLoadedUserId(user.id);
    });
    return () => { active = false; };
  }, [status, user?.id]);

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      if (typeof detail?.enabled === "boolean") setEnabled(detail.enabled);
    };
    window.addEventListener(MINI_CHAT_SETTING_CHANGED, listener);
    return () => window.removeEventListener(MINI_CHAT_SETTING_CHANGED, listener);
  }, []);

  useEffect(() => {
    const routeSlug = workspaceSlugFrom(pathname);
    if (!routeSlug || !workspaces.some((item) => item.slug === routeSlug)) return;
    const timer = window.setTimeout(() => setSelectedSlug(routeSlug), 0);
    window.localStorage.setItem(LAST_WORKSPACE_KEY, routeSlug);
    return () => window.clearTimeout(timer);
  }, [pathname, workspaces]);

  const selected = useMemo(
    () => workspaces.find((workspace) => workspace.slug === selectedSlug)
      ?? workspaces[0],
    [selectedSlug, workspaces],
  );
  const fullChatVisible = Boolean(
    selected
    && pathname === `/workspace/${selected.slug}`
    && searchParams.get("tab") === "chat",
  );
  const chat = useWorkspaceChat(selected?.slug ?? "", enabled && Boolean(selected) && !fullChatVisible, false);

  const selectWorkspace = (slug: string) => {
    setSelectedSlug(slug);
    window.localStorage.setItem(LAST_WORKSPACE_KEY, slug);
  };

  const close = async () => {
    setEnabled(false);
    announceMiniChatSetting(false);
    try {
      await api.account.updateSettings({ miniChatEnabled: false });
      toast.info("Đã tắt chat nhóm thu nhỏ. Bạn có thể bật lại trong Hồ sơ → Cài đặt → Giao diện.");
    } catch (cause) {
      setEnabled(true);
      announceMiniChatSetting(true);
      toast.error(cause instanceof Error ? cause.message : "Không thể lưu cài đặt chat nhóm.");
    }
  };

  if (status !== "authenticated" || loadedUserId !== user?.id || !enabled || !selected || fullChatVisible) return null;
  return <WorkspaceMiniChat
    workspaceName={selected.name}
    chat={chat}
    workspaces={workspaces.map(({ slug, name }) => ({ slug, name }))}
    selectedSlug={selected.slug}
    onSelectWorkspace={selectWorkspace}
    onOpenFull={() => router.push(`/workspace/${selected.slug}?tab=chat`)}
    onClose={() => void close()}
  />;
}

function workspaceSlugFrom(pathname: string) {
  const match = /^\/workspace\/([^/]+)$/.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function loadMyWorkspaces() {
  const items: WorkspaceListItem[] = [];
  let pageNumber = 1;
  let totalPages = 1;
  do {
    const page = await api.workspaces.list({ scope: "mine", page: pageNumber, limit: 50 });
    items.push(...page.items);
    totalPages = page.totalPages;
    pageNumber += 1;
  } while (pageNumber <= totalPages);
  return items;
}
