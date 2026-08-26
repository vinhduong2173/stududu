export interface ParsedVocabRow {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  type: string;
  example: string;
  distractors: string[];
  options: string[];
  correctIndex: number;
  hiddenOptions?: boolean[];
  status: "valid" | "warning";
}

/**
 * Standard RFC 4180 CSV parser that correctly handles quoted strings with commas and line breaks.
 */
export function parseCSVToVocabRows(text: string): ParsedVocabRow[] {
  if (!text || !text.trim()) return [];

  const cleanText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rawRows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length <= 1) return [];

  const result: ParsedVocabRow[] = [];
  for (let i = 1; i < rawRows.length; i++) {
    const cols = rawRows[i];
    if (cols.length >= 3 && cols[0]) {
      const correctAns = cols[2] || "";
      const d1 = cols[5] || "Đáp án 2";
      const d2 = cols[6] || "Đáp án 3";
      const d3 = cols[7] || "Đáp án 4";
      result.push({
        id: i,
        word: cols[0],
        phonetic: cols[1] || "",
        meaning: correctAns,
        type: cols[3] || "Danh từ",
        example: cols[4] || "",
        distractors: [d1, d2, d3],
        options: [correctAns, d1, d2, d3],
        correctIndex: 0,
        status: "valid",
      });
    }
  }

  return result;
}
