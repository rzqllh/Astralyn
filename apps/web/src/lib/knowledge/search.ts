export function normalizeSearchString(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type SearchAliasCategory = "community_alias" | "acronym" | "character_ref";

export interface SearchAliasEntry {
  alias: string;
  category: SearchAliasCategory;
}

// Structured search aliases for UI query matching without polluting canonical facts
export const STRUCTURED_SEARCH_ALIASES: Record<string, SearchAliasEntry[]> = {
  acheron: [
    { alias: "raiden", category: "character_ref" },
    { alias: "raiden mei", category: "character_ref" },
    { alias: "huangquan", category: "community_alias" },
    { alias: "mei", category: "character_ref" },
    { alias: "emanator of nihility", category: "community_alias" },
  ],
  castorice: [
    { alias: "netherwing", category: "community_alias" },
    { alias: "netherwing memosprite", category: "community_alias" },
    { alias: "remembrance quantum", category: "community_alias" },
    { alias: "aidonia", category: "community_alias" },
  ],
  firefly: [
    { alias: "sam", category: "character_ref" },
    { alias: "stellaron hunter sam", category: "character_ref" },
    { alias: "ar-267", category: "community_alias" },
    { alias: "fyrefly", category: "community_alias" },
  ],
  robin: [
    { alias: "halovian", category: "community_alias" },
    { alias: "singer", category: "community_alias" },
    { alias: "sunday sister", category: "community_alias" },
    { alias: "pinion", category: "community_alias" },
  ],
  aventurine: [
    { alias: "kakavasha", category: "character_ref" },
    { alias: "ipc aventurine", category: "community_alias" },
    { alias: "gambler", category: "community_alias" },
  ],
  "aventurine-waveflair": [
    { alias: "waveflair", category: "community_alias" },
    { alias: "aventurine 4.5", category: "community_alias" },
    { alias: "quantum elation", category: "community_alias" },
    { alias: "astropolis aventurine", category: "community_alias" },
    { alias: "elation aventurine", category: "community_alias" },
  ],
  gallagher: [
    { alias: "hound", category: "community_alias" },
    { alias: "security officer", category: "community_alias" },
    { alias: "bartender", category: "community_alias" },
  ],
  tingyun: [
    { alias: "foxian", category: "community_alias" },
    { alias: "amphorophore", category: "community_alias" },
    { alias: "yukong friend", category: "community_alias" },
    { alias: "sky-faring", category: "community_alias" },
  ],
  "the-herta": [
    { alias: "madam herta", category: "community_alias" },
    { alias: "herta 5 star", category: "community_alias" },
    { alias: "emanator of erudition", category: "community_alias" },
    { alias: "genius society 83", category: "community_alias" },
  ],
  "along-the-passing-shore": [
    { alias: "acheron sig", category: "acronym" },
    { alias: "acheron light cone", category: "community_alias" },
    { alias: "passing shore", category: "community_alias" },
  ],
  "whereabouts-should-dreams-rest": [
    { alias: "firefly sig", category: "acronym" },
    { alias: "firefly light cone", category: "community_alias" },
    { alias: "sam sig", category: "acronym" },
  ],
  "flowing-nightglow": [
    { alias: "robin sig", category: "acronym" },
    { alias: "robin light cone", category: "community_alias" },
  ],
  "inherently-unjust-destiny": [
    { alias: "aventurine sig", category: "acronym" },
    { alias: "aventurine light cone", category: "community_alias" },
    { alias: "unjust destiny", category: "community_alias" },
  ],
  "flame-of-carnival": [
    { alias: "waveflair sig", category: "acronym" },
    { alias: "aventurine elation sig", category: "acronym" },
    { alias: "elation light cone", category: "community_alias" },
  ],
  "pioneer-diver": [
    { alias: "pioneer", category: "community_alias" },
    { alias: "debuff set", category: "community_alias" },
    { alias: "dead waters", category: "community_alias" },
  ],
  watchmaker: [
    { alias: "watchmaker set", category: "community_alias" },
    { alias: "clockwork set", category: "community_alias" },
    { alias: "break set", category: "community_alias" },
  ],
  "iron-cavalry": [
    { alias: "cavalry", category: "community_alias" },
    { alias: "firefly relic", category: "community_alias" },
    { alias: "super break set", category: "community_alias" },
  ],
  "izumo-gensei": [
    { alias: "izumo", category: "community_alias" },
    { alias: "nihility planar", category: "community_alias" },
    { alias: "acheron planar", category: "community_alias" },
  ],
  "forge-of-the-kalpagni-lantern": [
    { alias: "kalpagni", category: "community_alias" },
    { alias: "fire planar", category: "community_alias" },
    { alias: "firefly planar", category: "community_alias" },
  ],
  "duran-dynasty-of-running-wolves": [
    { alias: "duran", category: "community_alias" },
    { alias: "fua planar", category: "community_alias" },
    { alias: "follow up planar", category: "community_alias" },
  ],
};

// Flattened aliases for fast query matching
export const CANONICAL_ALIASES: Record<string, string[]> = Object.fromEntries(
  Object.entries(STRUCTURED_SEARCH_ALIASES).map(([key, entries]) => [
    key,
    entries.map((e) => e.alias),
  ])
);
