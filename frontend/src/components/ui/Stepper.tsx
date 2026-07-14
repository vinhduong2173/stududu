import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full flex items-center justify-between", className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > index + 1;
        const isCurrent = currentStep === index + 1;
        
        return (
          <div key={step} className="flex flex-col items-center relative flex-1">
            <div className="flex items-center justify-center w-full">
              <div 
                className={cn(
                  "z-10 flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm transition-colors",
                  isCompleted ? "bg-primary text-white" : 
                  isCurrent ? "bg-primary text-white border-2 border-primary" : 
                  "bg-surface border-2 border-border text-muted"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : (index + 1)}
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-1/2 top-4 w-full h-0.5 -translate-y-1/2",
                    currentStep > index + 1 ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
            
            <span 
              className={cn(
                "mt-2 text-xs font-medium text-center",
                isCurrent || isCompleted ? "text-foreground" : "text-muted"
              )}
            >
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
