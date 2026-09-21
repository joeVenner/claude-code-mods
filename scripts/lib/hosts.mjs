// Hosts the verify script may fetch for catalog URLs. The script cannot import TypeScript, so it keeps
// its own copy of ALLOWED_CATALOG_HOSTS from src/lib/url.ts; src/lib/hosts-sync.test.ts fails when
// the two lists differ. A hostile catalog change must not be able to make a maintainer's machine
// fetch an arbitrary or internal host.
export const ALLOWED_CATALOG_HOSTS = ["github.com", "code.claude.com"];
