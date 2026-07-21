import * as React from "react";
import { Stepper } from "frontend";

export function Step1() {
  return (
    <div style={{ width: 420 }}>
      <Stepper steps={["Ngôn ngữ", "Sở thích", "Hoàn thiện"]} currentStep={1} />
    </div>
  );
}

export function Step2() {
  return (
    <div style={{ width: 420 }}>
      <Stepper steps={["Ngôn ngữ", "Sở thích", "Hoàn thiện"]} currentStep={2} />
    </div>
  );
}

export function Step3() {
  return (
    <div style={{ width: 420 }}>
      <Stepper steps={["Ngôn ngữ", "Sở thích", "Hoàn thiện"]} currentStep={3} />
    </div>
  );
}
