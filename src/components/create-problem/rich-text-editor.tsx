"use client";

import { useState, type ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
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
import { Select } from "@/components/ui/select";
import { MediaInsertModal, type MediaKind } from "./media-insert-modal";
import { FileVideo } from "./video-node";
import "highlight.js/styles/github-dark.css";

/** `common` is lowlight's ~37-language bundle; these are the ones this platform teaches,
 * surfaced in the picker so the list stays readable. Anything else still highlights if
 * the language attribute is set by hand. */
const CODE_LANGUAGES = [
  { value: "plaintext", label: "Không tô màu" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "HTML/XML" },
  { value: "css", label: "CSS" },
];

const lowlight = createLowlight(common);

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

function Toolbar({
  editor,
  onInsertLink,
  onInsertMedia,
}: {
  editor: Editor;
  onInsertLink: () => void;
  onInsertMedia: (kind: MediaKind) => void;
}) {
  const chain = () => editor.chain().focus();
  const inCodeBlock = editor.isActive("codeBlock");

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
        active={inCodeBlock}
        onClick={() => chain().toggleCodeBlock().run()}
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>
      {/* Only meaningful inside a code block, so it appears with one rather than sitting
       * permanently disabled in the strip. */}
      {inCodeBlock && (
        <Select
          label="Ngôn ngữ tô màu"
          shape="box"
          className="h-8"
          value={(editor.getAttributes("codeBlock").language as string) || "plaintext"}
          onChange={(language) =>
            chain().updateAttributes("codeBlock", { language }).run()
          }
          options={CODE_LANGUAGES}
        />
      )}

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

      <ToolbarButton label="Chèn liên kết" active={editor.isActive("link")} onClick={onInsertLink}>
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bỏ liên kết"
        disabled={!editor.isActive("link")}
        onClick={() => chain().unsetLink().run()}
      >
        <Link2Off className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Chèn ảnh" onClick={() => onInsertMedia("image")}>
        <ImagePlus className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Chèn video" onClick={() => onInsertMedia("video")}>
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
 * StarterKit already brings Bold/Italic/Underline/Link/Heading/lists in v3; alignment,
 * media, the placeholder and syntax-highlighted code blocks are added on top.
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
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
  const [localMediaWarning, setLocalMediaWarning] = useState(false);

  const editor = useEditor({
    // Tiptap renders to the DOM on mount; rendering during SSR would mismatch on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, HTMLAttributes: { target: "_blank" } },
        // Replaced by the lowlight variant below — leaving both registered would duplicate the node.
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Youtube.configure({ width: 640, height: 360 }),
      FileVideo,
      // Rendered as a ::before on the empty node itself, so it disappears the moment a
      // code block or quote is inserted. The old hand-rolled overlay kept drawing over them.
      Placeholder.configure({ placeholder }),
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

  const openLink = () => {
    // Prefill with the current link so the modal edits rather than blanks it.
    setLinkUrl(editor?.getAttributes("link").href ?? "");
    setLinkOpen(true);
  };

  const confirmLink = () => {
    const href = linkUrl.trim();
    if (!editor || !href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
    setLinkUrl("");
  };

  const insertMedia = (src: string, isLocal: boolean) => {
    if (!editor || !mediaKind) return;
    const chain = editor.chain().focus();
    // An inserted image/video lands as a *selected* node, so the author's next keystroke
    // would replace it. createParagraphNear drops the caret into a new line after it.
    let inserted;
    if (mediaKind === "image") inserted = chain.setImage({ src });
    // Only a real YouTube URL can become a YouTube embed; a picked file or a direct .mp4
    // link has to render as a plain <video> instead.
    else if (/youtube\.com|youtu\.be/.test(src)) inserted = chain.setYoutubeVideo({ src });
    else inserted = chain.setFileVideo({ src });
    inserted.createParagraphNear().run();
    if (isLocal) setLocalMediaWarning(true);
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
        <Toolbar editor={editor} onInsertLink={openLink} onInsertMedia={setMediaKind} />
        <div className="bg-surface">
          <EditorContent editor={editor} />
        </div>
      </div>

      {localMediaWarning && (
        <p className="mt-2 rounded-md border border-border bg-bg px-3 py-2 text-xs text-navy">
          Tệp từ máy chỉ hiển thị tạm trong phiên soạn thảo này — chưa có kho lưu trữ nên nội
          dung sẽ mất khi tải lại trang.
        </p>
      )}

      <MediaInsertModal kind={mediaKind} onClose={() => setMediaKind(null)} onInsert={insertMedia} />

      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        width="sm"
        title="Chèn liên kết"
        description="Liên kết mở ở tab mới. Bôi đen chữ trước khi chèn để gắn vào đoạn văn bản đó."
        footer={
          <>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Hủy
            </Button>
            <Button onClick={confirmLink} disabled={!linkUrl.trim()}>
              Chèn
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmLink()}
          placeholder="https://..."
        />
      </Modal>
    </>
  );
}
