// Reads the latest Synertrack Desktop release from GitHub. Cached for an hour, so
// when CI publishes a new release the site picks it up automatically — no redeploy.

const REPO = "hussainbangash/synertrack-desktop";
export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;

export interface ReleaseAsset {
  name: string;
  url: string;
  size: number;
}

export interface DesktopRelease {
  version: string;
  htmlUrl: string;
  assets: ReleaseAsset[];
}

interface GhAsset {
  name: string;
  browser_download_url: string;
  size: number;
}
interface GhRelease {
  tag_name: string;
  html_url: string;
  assets: GhAsset[];
}

export async function getLatestDesktopRelease(): Promise<DesktopRelease | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GhRelease;
    return {
      version: data.tag_name,
      htmlUrl: data.html_url,
      assets: (data.assets ?? [])
        .filter((a) => a.name.toLowerCase().endsWith(".exe"))
        .map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size })),
    };
  } catch {
    return null;
  }
}
