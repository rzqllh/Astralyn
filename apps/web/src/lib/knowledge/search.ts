export function normalizeSearchString(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const CANONICAL_ALIASES: Record<string, string[]> = {
  acheron: ["raiden", "raiden mei", "huangquan", "mei", "emanator of nihility"],
  castorice: ["polly", "castorice memosprite", "remembrance quantum"],
  firefly: ["sam", "stellaron hunter sam", "ar-267", "fyrefly"],
  robin: ["halovian", "singer", "sunday sister", "pinion"],
  aventurine: ["kakavasha", "ipc aventurine", "gambler"],
  gallagher: ["hound", "security officer", "bartender"],
  tingyun: ["foxian", "amphorophore", "yukong friend", "sky-faring"],
  "the-herta": [
    "madam herta",
    "herta 5 star",
    "emanator of erudition",
    "genius society 83",
  ],
  "along-the-passing-shore": ["acheron sig", "acheron light cone", "passing shore"],
  "whereabouts-should-dreams-rest": ["firefly sig", "firefly light cone", "sam sig"],
  "flowing-nightglow": ["robin sig", "robin light cone"],
  "inherent-sols-unjust-destiny": [
    "aventurine sig",
    "aventurine light cone",
    "unjust destiny",
  ],
  "pioneer-diver": ["pioneer", "debuff set", "dead waters"],
  watchmaker: ["watchmaker set", "clockwork set", "break set"],
  "iron-cavalry": ["cavalry", "firefly relic", "super break set"],
  "izumo-gensei": ["izumo", "nihility planar", "acheron planar"],
  "forge-of-the-kalpagni-lantern": ["kalpagni", "fire planar", "firefly planar"],
  "duran-dynasty-of-running-wolves": ["duran", "fua planar", "follow up planar"],
};
