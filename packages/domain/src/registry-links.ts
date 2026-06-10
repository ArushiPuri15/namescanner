export type RegistryLinkLocale = {
  country: string;
  region?: string;
};

export type RegistryActions = {
  mcaSearchUrl?: string;
  ipIndiaSearchUrl?: string;
  googleSearchUrl?: string;
};

export function slugifyForDomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 63);
}

export function buildRegistryActions(
  name: string,
  locale: RegistryLinkLocale,
): RegistryActions {
  const encoded = encodeURIComponent(name);
  const actions: RegistryActions = {
    googleSearchUrl: `https://www.google.com/search?q=${encoded}+company+india`,
  };

  if (locale.country.toUpperCase() === "IN") {
    actions.mcaSearchUrl = `https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html`;
    actions.ipIndiaSearchUrl = `https://ipindiaonline.gov.in/tmrpublicsearch/frmmain.aspx`;
    actions.googleSearchUrl = `https://www.google.com/search?q=${encoded}+india+company`;
  }

  return actions;
}
