import { site } from "./site";
import type { HeroContext } from "./types";

export const heroContext: HeroContext = {
  title: site.title,
  tagline: site.tagline,
  badge: "Framework-agnostic templates",
  ctaPrimary: { text: "Get started", href: "#getting-started" },
  ctaSecondary: { text: "View on GitHub", href: site.github },
};
