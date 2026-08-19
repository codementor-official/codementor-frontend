"use client";

import { useEffect, useState } from "react";
import { Select, type SelectOption } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { usersApi } from "@/lib/api";

/** Danh sách giảng viên cho ô lọc "Giảng viên" — dùng chung cho ba trang quản lý nội
 * dung. Nạp một lần cho cả trang: danh sách giảng viên đổi rất hiếm. */
export function useLecturerOptions(): SelectOption[] {
  const request = useAdminApi();
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    void usersApi
      .list(request, { role: "lecturer", limit: 100 })
      .then((page) => setOptions(page.items.map((user) => ({ value: user.id, label: user.displayName }))))
      .catch(() => setOptions([]));
  }, [request]);

  return options;
}

export function LecturerFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <Select
      label="Giảng viên"
      onChange={onChange}
      options={[{ value: "", label: "Mọi giảng viên" }, ...options]}
      value={value}
    />
  );
}
