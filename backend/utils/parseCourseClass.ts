const NBSP = " "; // U+00A0

// rawLabelText 格式為「{系所}{nbsp}{班級}\n{英文系所}」（#Label5 clone 後把 <br> 換成 \n 再取 text）
export function extractClassName(rawLabelText: string): string | null {
  const firstLine = rawLabelText.split("\n")[0] ?? "";
  const lastNbspIndex = firstLine.lastIndexOf(NBSP);
  const className = lastNbspIndex >= 0 ? firstLine.slice(lastNbspIndex + 1).trim() : firstLine.trim();
  return className.length > 0 ? className : null;
}

const GRADE_CHAR_MAP: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4 };
const GRADUATE_MARKERS = ["碩", "博"];

// 研究所班級命名不規則（碩一、數位系碩一博一合...），無法可靠判斷時不硬猜，一律回傳 null
export function parseGradesFromClassName(className: string): number[] | null {
  if (GRADUATE_MARKERS.some((marker) => className.includes(marker))) {
    return null;
  }

  const grades = new Set<number>();
  for (const char of className) {
    const grade = GRADE_CHAR_MAP[char];
    if (grade) grades.add(grade);
  }

  return grades.size > 0 ? Array.from(grades).sort((a, b) => a - b) : null;
}
