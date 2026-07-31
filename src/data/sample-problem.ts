export interface TestCase {
  input: string;
  expected: string;
}

export interface Problem {
  slug: string;
  title: string;
  difficulty: "Cơ bản" | "Trung bình" | "Nâng cao";
  tags: string[];
  description: string;
  constraints: string[];
  testCases: TestCase[];
  starter: Record<string, string>;
}

export const problems: Problem[] = [
  {
    slug: "giai-phuong-trinh-bac-hai",
    title: "Giải Phương trình Bậc hai",
    difficulty: "Cơ bản",
    tags: ["Toán học", "Điều kiện"],
    description: `Cho ba số thực \`a\`, \`b\`, \`c\` là hệ số của phương trình bậc hai \`ax² + bx + c = 0\` (a ≠ 0). Viết chương trình tính và in ra nghiệm thực của phương trình, xử lý đầy đủ ba trường hợp của \`delta = b² − 4ac\`.

**Ví dụ 1:**

\`\`\`
Input: a=1 b=-3 c=2
Output: x1=2.00 x2=1.00
\`\`\`

**Ví dụ 2 (delta = 0):**

\`\`\`
Input: a=1 b=2 c=1
Output: x=-1.00
\`\`\`

**Ví dụ 3 (delta < 0):**

\`\`\`
Input: a=1 b=2 c=5
Output: Phương trình vô nghiệm thực
\`\`\`
`,
    constraints: ["-10⁶ ≤ a, b, c ≤ 10⁶, a ≠ 0", "Kết quả in với 2 chữ số thập phân", "Giới hạn thời gian: 1 giây"],
    testCases: [
      { input: "a=1 b=-3 c=2", expected: "x1=2.00 x2=1.00" },
      { input: "a=1 b=2 c=1", expected: "x=-1.00" },
      { input: "a=1 b=2 c=5", expected: "Phương trình vô nghiệm thực" },
    ],
    starter: {
      C: 'int main() {\n  // TODO: đọc a, b, c và in nghiệm\n  return 0;\n}',
      "C++": "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // TODO: đọc a, b, c và in nghiệm\n  return 0;\n}",
      Python: "# TODO: đọc a, b, c và in nghiệm\n",
      JavaScript: "// TODO: đọc a, b, c và in nghiệm\n",
    },
  },
  {
    slug: "xoay-mang",
    title: "Xoay Mảng",
    difficulty: "Trung bình",
    tags: ["Mảng"],
    description: `Cho một mảng số nguyên gồm \`n\` phần tử và một số nguyên không âm \`k\`. Hãy xoay mảng sang phải \`k\` vị trí — phần tử tràn ra cuối sẽ quay lại từ đầu mảng.

**Ví dụ:**

\`\`\`
Input: n=7 arr=[1,2,3,4,5,6,7] k=3
Output: [5,6,7,1,2,3,4]
\`\`\`
`,
    constraints: ["1 ≤ n ≤ 10⁵, 0 ≤ k ≤ 10⁹ (cần chuẩn hóa k = k % n)", "Không cấp phát thêm mảng phụ kích thước O(n)"],
    testCases: [
      { input: "n=7 arr=[1,2,3,4,5,6,7] k=3", expected: "[5,6,7,1,2,3,4]" },
      { input: "n=3 arr=[1,2,3] k=0", expected: "[1,2,3]" },
    ],
    starter: {
      C: "int main() {\n  // TODO: đọc mảng và xoay phải k vị trí\n  return 0;\n}",
      "C++": "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // TODO: đọc mảng và xoay phải k vị trí\n  return 0;\n}",
      Python: "# TODO: đọc mảng và xoay phải k vị trí\n",
      JavaScript: "// TODO: đọc mảng và xoay phải k vị trí\n",
    },
  },
];

export function getProblem(slug: string): Problem {
  return problems.find((p) => p.slug === slug) ?? problems[0];
}
