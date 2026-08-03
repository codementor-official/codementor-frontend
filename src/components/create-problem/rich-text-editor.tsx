"use client";

import { useState, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
  // lucide-react v1 dropped brand marks, so the YouTube action wears a generic video icon.
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

/** What the "insert URL" modal is currently collecting. */
type UrlKind = "link" | "image" | "video";

const URL_COPY: Record<UrlKind, { title: string; description: string; placeholder: string }> = {
  link: {
    title: "Chèn liên kết",
    description: "Liên kết mở ở tab mới. Bôi đen chữ trước khi chèn để gắn vào đoạn văn bản đó.",
    placeholder: "https://...",
  },
  image: {
    title: "Chèn ảnh",
    description: "Dán URL ảnh từ nguồn bên ngoài.",
    placeholder: "https://.../hinh-anh.png",
  },
  video: {
    title: "Chèn video YouTube",
    description: "Dán link YouTube đầy đủ — video được nhúng trực tiếp vào bài.",
    placeholder: "https://www.youtube.com/watch?v=...",
  },
};

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-navy text-white" : "text-text-muted hover:bg-bg hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />;
}

function Toolbar({ editor, onInsert }: { editor: Editor; onInsert: (kind: UrlKind) => void }) {
  const chain = () => editor.chain().focus();

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface p-1.5">
      {([1, 2, 3] as const).map((level) => {
        const Icon = { 1: Heading1, 2: Heading2, 3: Heading3 }[level];
        return (
          <ToolbarButton
            key={level}
            label={`Tiêu đề ${level}`}
            active={editor.isActive("heading", { level })}
            onClick={() => chain().toggleHeading({ level }).run()}
          >
            <Icon className="h-4 w-4" />
          </ToolbarButton>
        );
      })}

      <Divider />

      <ToolbarButton
        label="In đậm"
        active={editor.isActive("bold")}
        onClick={() => chain().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="In nghiêng"
        active={editor.isActive("italic")}
        onClick={() => chain().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Gạch chân"
        active={editor.isActive("underline")}
        onClick={() => chain().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Khối code"
        active={editor.isActive("codeBlock")}
        onClick={() => chain().toggleCodeBlock().run()}
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {(
        [
          ["left", AlignLeft, "Căn trái"],
          ["center", AlignCenter, "Căn giữa"],
          ["right", AlignRight, "Căn phải"],
          ["justify", AlignJustify, "Căn đều"],
        ] as const
      ).map(([align, Icon, label]) => (
        <ToolbarButton
          key={align}
          label={label}
          active={editor.isActive({ textAlign: align })}
          onClick={() => chain().setTextAlign(align).run()}
        >
          <Icon className="h-4 w-4" />
        </ToolbarButton>
      ))}

      <Divider />

      <ToolbarButton
        label="Danh sách"
        active={editor.isActive("bulletList")}
        onClick={() => chain().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Danh sách đánh số"
        active={editor.isActive("orderedList")}
        onClick={() => chain().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Trích dẫn"
        active={editor.isActive("blockquote")}
        onClick={() => chain().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Chèn liên kết" active={editor.isActive("link")} onClick={() => onInsert("link")}>
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bỏ liên kết"
        disabled={!editor.isActive("link")}
        onClick={() => chain().unsetLink().run()}
      >
        <Link2Off className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Chèn ảnh" onClick={() => onInsert("image")}>
        <ImagePlus className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Chèn video YouTube" onClick={() => onInsert("video")}>
        <Video className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        label="Hoàn tác"
        disabled={!editor.can().undo()}
        onClick={() => chain().undo().run()}
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Làm lại"
        disabled={!editor.can().redo()}
        onClick={() => chain().redo().run()}
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

/**
 * Tiptap is headless — it ships no CSS, so the rendered document is styled by the
 * `.rich-text` rules in globals.css and nothing here fights the design system.
 * StarterKit already brings Bold/Italic/Underline/Link/Heading/CodeBlock/lists in v3;
 * only alignment, images and YouTube embeds are added on top.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Bắt đầu soạn nội dung bài học...",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [urlKind, setUrlKind] = useState<UrlKind | null>(null);
  const [url, setUrl] = useState("");

  const editor = useEditor({
    // Tiptap renders to the DOM on mount; rendering during SSR would mismatch on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, HTMLAttributes: { target: "_blank" } } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-text min-h-80 px-4 py-3 outline-none",
        "aria-label": "Nội dung bài học",
      },
    },
  });

  const openInsert = (kind: UrlKind) => {
    // Prefill with the current link so the modal edits rather than blanks it.
    setUrl(kind === "link" ? (editor?.getAttributes("link").href ?? "") : "");
    setUrlKind(kind);
  };

  const confirmInsert = () => {
    const href = url.trim();
    if (!editor || !href || !urlKind) return;
    const chain = editor.chain().focus();
    if (urlKind === "link") {
      chain.extendMarkRange("link").setLink({ href }).run();
    } else {
      // An inserted image/video lands as a *selected* node, so the author's next keystroke
      // would replace it. createParagraphNear drops the caret into a new line after it.
      const inserted =
        urlKind === "image" ? chain.setImage({ src: href }) : chain.setYoutubeVideo({ src: href });
      inserted.createParagraphNear().run();
    }
    setUrlKind(null);
    setUrl("");
  };

  if (!editor) {
    return (
      <div className="flex h-96 items-center justify-center rounded-md border border-border text-xs text-text-faint">
        Đang tải trình soạn thảo...
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-md border border-border">
        <Toolbar editor={editor} onInsert={openInsert} />
        <div className="relative bg-surface">
          <EditorContent editor={editor} />
          {editor.isEmpty && (
            <span className="pointer-events-none absolute top-3 left-4 text-sm text-text-faint">
              {placeholder}
            </span>
          )}
        </div>
      </div>

      <Modal
        open={urlKind !== null}
        onClose={() => setUrlKind(null)}
        width="sm"
        title={urlKind ? URL_COPY[urlKind].title : ""}
        description={urlKind ? URL_COPY[urlKind].description : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setUrlKind(null)}>
              Hủy
            </Button>
            <Button onClick={confirmInsert} disabled={!url.trim()}>
              Chèn
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmInsert()}
          placeholder={urlKind ? URL_COPY[urlKind].placeholder : ""}
        />
      </Modal>
    </>
  );
}
