import * as React from "react";
import { TranslationModal } from "frontend";

export function BangDich() {
  return (
    <TranslationModal
      open
      onClose={() => {}}
      initialText="How are you today? I hope you are doing well."
    />
  );
}
