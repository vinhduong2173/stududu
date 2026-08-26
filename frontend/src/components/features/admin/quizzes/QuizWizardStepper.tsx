import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepIndex } from "@/hooks/useQuizCreateWizard";

const STEPS_LIST = [
  { num: 1, label: "Tạo bộ đề" },
  { num: 2, label: "Upload & Mẫu" },
  { num: 3, label: "Chỉnh sửa câu hỏi" },
  { num: 4, label: "Phát hành" },
];

interface QuizWizardStepperProps {
  currentStep: StepIndex;
  onStepClick: (step: StepIndex) => void;
}

export function QuizWizardStepper({
  currentStep,
  onStepClick,
}: QuizWizardStepperProps) {
  return (
    <div className="overflow-x-auto border-b border-border bg-surface/50 px-6 py-6">
      <div className="mx-auto flex max-w-2xl min-w-[420px] items-center justify-between px-4">
        {STEPS_LIST.map((step, idx) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <React.Fragment key={step.num}>
              <div
                onClick={() => onStepClick(step.num as StepIndex)}
                className="group flex cursor-pointer flex-col items-center"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-2xs transition-all",
                    isCurrent
                      ? "scale-105 bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "border-2 border-border bg-surface text-muted group-hover:border-primary/50"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.num}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-semibold transition-colors",
                    isCurrent ? "font-bold text-primary" : "text-muted group-hover:text-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {idx < STEPS_LIST.length - 1 && (
                <div
                  className={cn(
                    "mx-3 mb-6 h-0.5 flex-1 transition-all",
                    currentStep > step.num ? "bg-emerald-500" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
