import * as React from "react";
import { MatchModal } from "frontend";

export function DaMatch() {
  return (
    <MatchModal
      isOpen
      onClose={() => {}}
      partnerName="Sarah Jenkins"
      conversationId={12}
    />
  );
}
