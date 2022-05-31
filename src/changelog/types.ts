import { Eq } from "fp-ts/lib/Eq";

/* eslint-disable sonarjs/no-duplicate-string */
export type Scope =
  | "Android"
  | "iOS"
  | "Bonus Vacanze"
  | "Messages"
  | "Payments"
  | "Services"
  | "Profile"
  | "Privacy"
  | "Security"
  | "Accessibility"
  | "Bonus Pagamenti Digitali"
  | "Carta Giovani Nazionale"
  | "Federated Identity Management System"
  | "My Portal"
  | "Sicilia Vola"
  | "EU Covid Certificate"
  | "Redesign Servizi"
  | "Zendesk"
  | "Piattaforma Notifiche"
  | "Federated Identity Management System"
  | "Carta della cultura";

export const EqScope: Eq<Scope> = {
  equals: (first, second) => first === second,
};

export const tagToScope: Record<string, Scope> = {
  android: "Android",
  ios: "iOS",
  bonus_vacanze: "Bonus Vacanze",
  messages: "Messages",
  payments: "Payments",
  services: "Services",
  profile: "Profile",
  privacy: "Privacy",
  security: "Security",
  accessibility: "Accessibility",
  bpd: "Bonus Pagamenti Digitali",
  cgn: "Carta Giovani Nazionale",
  fims: "Federated Identity Management System",
  myportal: "My Portal",
};

export const projectToScope: Record<string, Scope> = {
  2449547: "Bonus Vacanze",
  2463683: "My Portal",
  2477137: "Bonus Pagamenti Digitali",
  IAC: "Bonus Pagamenti Digitali",
  IOACGN: "Carta Giovani Nazionale",
  IASV: "Sicilia Vola",
  IAGP: "EU Covid Certificate",
  IARS: "Redesign Servizi",
  ASZ: "Zendesk",
  IAMVL: "Piattaforma Notifiche",
  IAFIMS: "Federated Identity Management System",
  AP: "Carta della cultura",
};
