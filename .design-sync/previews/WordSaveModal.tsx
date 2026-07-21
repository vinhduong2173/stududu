import * as React from "react";
import { WordSaveModal } from "frontend";

export function LuuTu() {
  return (
    <WordSaveModal
      open
      onClose={() => {}}
      initialWord="serendipity"
      source="chat"
    />
  );
}
