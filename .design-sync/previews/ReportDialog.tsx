import * as React from "react";
import { ReportDialog } from "frontend";

export function BaoCao() {
  return (
    <ReportDialog
      open
      onClose={() => {}}
      targetId={2}
      targetName="Sarah Jenkins"
    />
  );
}
