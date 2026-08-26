"use client";

import * as React from "react";
import { RegisterLocationFields } from "./RegisterLocationFields";
import { RegisterProfileDetails } from "./RegisterProfileDetails";
import { RegisterCredentialsFields } from "./RegisterCredentialsFields";

interface RegisterFormFieldsProps {
  t: any;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  country: string;
  handleCountryChange: (country: string) => void;
  city: string;
  setCity: (val: string) => void;
  intent: string;
  setIntent: (val: string) => void;
  day: string;
  setDay: (val: string) => void;
  month: string;
  setMonth: (val: string) => void;
  year: string;
  setYear: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  saveDraft: (overrides?: Record<string, string>) => void;
  handleRegister: (e: React.FormEvent) => void;
  loading: boolean;
  isPending: boolean;
  days: string[];
  months: { value: string; label: string }[];
  years: string[];
}

export function RegisterFormFields(props: RegisterFormFieldsProps) {
  return (
    <form onSubmit={props.handleRegister} className="flex flex-col gap-4">
      <RegisterLocationFields
        t={props.t}
        firstName={props.firstName}
        setFirstName={props.setFirstName}
        lastName={props.lastName}
        setLastName={props.setLastName}
        country={props.country}
        handleCountryChange={props.handleCountryChange}
        city={props.city}
        setCity={props.setCity}
        saveDraft={props.saveDraft}
        isPending={props.isPending}
      />

      <RegisterProfileDetails
        t={props.t}
        intent={props.intent}
        setIntent={props.setIntent}
        day={props.day}
        setDay={props.setDay}
        month={props.month}
        setMonth={props.setMonth}
        year={props.year}
        setYear={props.setYear}
        gender={props.gender}
        setGender={props.setGender}
        saveDraft={props.saveDraft}
        days={props.days}
        months={props.months}
        years={props.years}
      />

      <RegisterCredentialsFields
        t={props.t}
        email={props.email}
        setEmail={props.setEmail}
        password={props.password}
        setPassword={props.setPassword}
        saveDraft={props.saveDraft}
        loading={props.loading}
        isPending={props.isPending}
      />
    </form>
  );
}
