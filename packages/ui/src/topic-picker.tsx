"use client";

import { useId, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "./button";

export interface TopicOption {
  id: string;
  name: string;
}

/**
 * Chọn chủ đề bằng cách GÕ, không phải bằng cách tìm trong một rổ nút.
 *
 * Từ vựng chủ đề mở: gõ tên chưa có thì tạo luôn (`onCreate`). Gợi ý dùng `<datalist>` —
 * trình duyệt tự lọc theo thứ đang gõ, tự xử bàn phím và đọc màn hình; một hộp gợi ý tự
 * viết chỉ để làm lại chuyện đó thì tốn vài trăm dòng để tệ hơn.
 *
 * Dùng chung cho ba studio (bài tập, khóa học, lộ trình) — cả ba gắn chủ đề từ cùng một
 * từ vựng, và ba bản sao của cùng một ô nhập là ba chỗ để hành vi lệch nhau.
 */
export function TopicPicker({
  value,
  options,
  onChange,
  onCreate,
  max = 8,
  readOnly = false,
  label = "Chủ đề",
  hint = "Dùng để gợi ý nội dung cùng chủ đề cho học viên. Gõ để tìm, Enter để thêm; tên chưa có sẽ được tạo mới.",
}: {
  /** Id chủ đề đã chọn. */
  value: string[];
  /** Từ vựng để gợi ý. */
  options: TopicOption[];
  onChange: (topicIds: string[]) => void;
  /** Vắng mặt thì ô nhập chỉ chọn được thứ đã có. */
  onCreate?: (name: string) => Promise<TopicOption>;
  /** Khớp trần phía backend. */
  max?: number;
  readOnly?: boolean;
  label?: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listId = useId();

  const byId = new Map(options.map((option) => [option.id, option]));
  const selected = value
    .map((id) => byId.get(id))
    .filter((topic): topic is TopicOption => Boolean(topic));
  const full = value.length >= max;

  const add = async () => {
    const name = draft.trim();
    if (name === "" || full) return;

    const existing = options.find(
      (option) => option.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      setError(null);
      setDraft("");
      if (!value.includes(existing.id)) onChange([...value, existing.id]);
      return;
    }

    if (!onCreate) {
      setError(`Chưa có chủ đề “${name}”.`);
      return;
    }

    setBusy(true);
    try {
      const created = await onCreate(name);
      setDraft("");
      setError(null);
      // Chủ đề mới có thể trùng với một chủ đề đã có (khác cách gõ hoa thường, khác dấu
      // câu): server trả về cái cũ, nên vẫn phải kiểm trước khi thêm.
      if (!value.includes(created.id)) onChange([...value, created.id]);
    } catch {
      setError("Không thêm được chủ đề. Thử lại sau.");
    } finally {
      setBusy(false);
    }
  };

  return (
    // `role="group"`: nhãn của một NHÓM không trỏ được vào một control duy nhất, mà
    // `<label htmlFor>` thì đòi đúng một cái.
    <div aria-labelledby={`${listId}-label`} role="group">
      <span className="mb-1.5 block text-sm font-medium" id={`${listId}-label`}>
        {label}
      </span>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((topic) => (
            <span
              key={topic.id}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-ink"
            >
              {topic.name}
              <button
                aria-label={`Bỏ chủ đề ${topic.name}`}
                className="opacity-70 hover:opacity-100 disabled:opacity-40"
                disabled={readOnly}
                onClick={() => onChange(value.filter((id) => id !== topic.id))}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="h-9 w-full rounded-lg border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring"
          disabled={readOnly || full}
          list={listId}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter trong một form là "gửi đi"; ở đây nó phải là "thêm chủ đề này".
            if (event.key !== "Enter") return;
            event.preventDefault();
            void add();
          }}
          placeholder={full ? `Đã đủ ${max} chủ đề` : "Đệ quy, Đồ thị, ..."}
          value={draft}
        />
        <datalist id={listId}>
          {options
            .filter((option) => !value.includes(option.id))
            .map((option) => (
              <option key={option.id} value={option.name} />
            ))}
        </datalist>
        <Button
          disabled={readOnly || full || busy || draft.trim() === ""}
          onClick={() => void add()}
          type="button"
          variant="outline"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Thêm
        </Button>
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
