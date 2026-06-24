export interface HeroContext {
  title: string;
  tagline: string;
  badge: string;
  ctaPrimary: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  badge?: string;
}

export interface FeaturesContext {
  items: Feature[];
}

export interface SyntaxExample {
  id: "for" | "if" | "switch";
  label: string;
  code: string;
  description: string;
}

export interface SyntaxShowcaseContext {
  examples: SyntaxExample[];
}

export interface Step {
  label: string;
  code: string;
  description: string;
}

export interface GettingStartedContext {
  title: string;
  description: string;
  steps: Step[];
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterContext {
  brand: string;
  tagline: string;
  links: FooterLink[];
  copyright: string;
}

export interface SiteMeta {
  title: string;
  tagline: string;
  description: string;
  url: string;
  github: string;
  docs: string;
}
