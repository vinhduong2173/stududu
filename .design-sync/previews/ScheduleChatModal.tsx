import * as React from "react";
import { ScheduleChatModal } from "frontend";

export function HenGio() {
  return (
    <ScheduleChatModal
      open
      onClose={() => {}}
      partnerName="Sarah Jenkins"
      partnerFlag="🇬🇧"
      partnerOffset={0}
      myOffset={7}
      partnerSlotIds={["s3", "s5"]}
      onSchedule={() => {}}
    />
  );
}
