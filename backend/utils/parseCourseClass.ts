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

const GRADUATE_LEVEL_ORDER = ["碩一", "碩二以上", "博一", "博二以上"];
const YEAR_CHAR_TO_LEVEL: Record<string, "一" | "二以上"> = {
  一: "一",
  二: "二以上",
  三: "二以上",
  四: "二以上",
};
const CLAUSE_BREAK_CHARS = new Set(["、", ","]);

// 在片段中找年級字元：找到第一個年級字元前若先遇到頓號/逗號，代表接的是另一個子句
// （例如「碩、數位四合」的「數位四」其實是另外重述的大學部班級，跟碩士年級無關），放棄整段。
// 找到年級字元後，只允許用頓號/逗號銜接下一個年級字元，其餘字元視為片段結束。
function collectLevelsInSegment(segment: string): Set<"一" | "二以上"> {
  const found = new Set<"一" | "二以上">();
  for (const char of segment) {
    const level = YEAR_CHAR_TO_LEVEL[char];
    if (level) {
      found.add(level);
      continue;
    }
    if (found.size === 0) {
      if (CLAUSE_BREAK_CHARS.has(char)) return found;
      continue;
    }
    if (!CLAUSE_BREAK_CHARS.has(char)) break;
  }
  return found;
}

// 少數班級名稱本身完全沒有「碩」「博」字（年級資訊藏在系所名稱裡），但已跟學校選課網頁核對過語意，
// 不是用規則猜的，是確認過的事實，所以直接列出來對應。
const KNOWN_CLASS_NAME_OVERRIDES: Record<string, string[]> = {
  "幼夜日  諮夜合": ["碩一", "碩二以上"], // 碩士在職專班，不分年級皆可選
  "理工學院智慧學位學程一(夜)": ["碩一"],
  "理工學院智慧學位學程二(夜)": ["碩二以上"],
};

// 對每個「碩」「博」出現位置，取該字元到下一個學位標記（或字串結尾）之間的片段找年級字元；
// 同一個學位標記可能出現多次（例如「碩專班碩一(夜)」），只要其中任一次片段找到年級，就採用找到的結果；
// 若這個學位標記每次出現都找不到年級（例如「碩博班合選」的「碩」「博」都沒寫年級），代表這個學位本身
// 不分年級、開放所有年級皆可選，兩個年級桶都算進去（而不是排除）。
// 整個字串裡完全沒有「碩」「博」字才回傳 null（真的什麼都不知道，不硬猜）。
export function parseGraduateLevelsFromClassName(className: string): string[] | null {
  if (className in KNOWN_CLASS_NAME_OVERRIDES) {
    return KNOWN_CLASS_NAME_OVERRIDES[className];
  }

  const markers: { degree: "碩" | "博"; index: number }[] = [];
  for (let i = 0; i < className.length; i++) {
    const char = className[i];
    if (char === "碩" || char === "博") {
      markers.push({ degree: char, index: i });
    }
  }

  if (markers.length === 0) return null;

  const foundByDegree: Record<"碩" | "博", Set<"一" | "二以上">> = { 碩: new Set(), 博: new Set() };
  const degreesPresent = new Set<"碩" | "博">();

  markers.forEach((marker, i) => {
    degreesPresent.add(marker.degree);
    const segmentEnd = i + 1 < markers.length ? markers[i + 1].index : className.length;
    const segment = className.slice(marker.index + 1, segmentEnd);
    collectLevelsInSegment(segment).forEach((level) => foundByDegree[marker.degree].add(level));
  });

  const levels = new Set<string>();
  degreesPresent.forEach((degree) => {
    const found = foundByDegree[degree];
    if (found.size > 0) {
      found.forEach((level) => levels.add(`${degree}${level}`));
    } else {
      levels.add(`${degree}一`);
      levels.add(`${degree}二以上`);
    }
  });

  return levels.size > 0 ? GRADUATE_LEVEL_ORDER.filter((level) => levels.has(level)) : null;
}
