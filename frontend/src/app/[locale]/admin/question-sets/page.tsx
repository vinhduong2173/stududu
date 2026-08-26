"use client";

import * as React from "react";
import { useRouter } from "@/i18n/routing";

export default function QuestionSetsRedirectPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/admin/quizzes");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
