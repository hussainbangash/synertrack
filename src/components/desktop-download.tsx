import { getLatestDesktopRelease, RELEASES_URL, type ReleaseAsset } from "@/lib/desktop-release";

function labelFor(name: string): string {
  if (/setup/i.test(name)) return "Download installer";
  if (/portable/i.test(name)) return "Download portable";
  return "Download";
}

function mb(bytes: number): string {
  return `${Math.round(bytes / 1048576)} MB`;
}

function pickInstaller(assets: ReleaseAsset[]): ReleaseAsset | undefined {
  return assets.find((a) => /setup/i.test(a.name)) ?? assets[0];
}

/**
 * "Get the desktop app" — reads the latest GitHub release (cached hourly, so new
 * releases appear automatically). `compact` renders a slim one-line banner for
 * busy pages; the default is the full card.
 */
export async function DesktopDownload({ compact = false }: { compact?: boolean }) {
  const release = await getLatestDesktopRelease();
  const hasAssets = Boolean(release && release.assets.length > 0);

  if (compact) {
    const installer = release ? pickInstaller(release.assets) : undefined;
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🖥️</span>
          <div>
            <p className="font-semibold text-slate-900">Synertrack for Windows</p>
            <p className="text-xs text-slate-500">
              Tray timer with automatic idle detection, synced to your account.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {installer ? (
            <a
              href={installer.url}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Download for Windows
            </a>
          ) : null}
          <a href={release?.htmlUrl ?? RELEASES_URL} className="text-sm text-slate-500 underline hover:text-slate-700">
            {installer ? "all downloads" : "Get the desktop app"}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Get the desktop app</h3>
      <p className="mt-1 text-sm text-slate-600">
        A tray timer for Windows that syncs with your account — start/stop from the tray,
        automatic idle detection, and an always-on-top mini timer.
      </p>

      {hasAssets && release ? (
        <>
          <div className="mt-4 flex flex-wrap gap-3">
            {release.assets.map((asset) => (
              <a
                key={asset.name}
                href={asset.url}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                {labelFor(asset.name)}
                <span className="ml-1 text-xs font-normal text-slate-300">({mb(asset.size)})</span>
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Latest: <span className="font-medium">{release.version}</span> · unsigned, so Windows
            SmartScreen may warn on first launch (More info → Run anyway) ·{" "}
            <a href={release.htmlUrl} className="underline hover:text-slate-700">
              all downloads
            </a>
          </p>
        </>
      ) : (
        <a
          href={RELEASES_URL}
          className="mt-4 inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View releases on GitHub
        </a>
      )}
    </section>
  );
}
