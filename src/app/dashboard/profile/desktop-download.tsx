import { getLatestDesktopRelease, RELEASES_URL } from "@/lib/desktop-release";

function labelFor(name: string): string {
  if (/setup/i.test(name)) return "Download installer";
  if (/portable/i.test(name)) return "Download portable";
  return "Download";
}

function mb(bytes: number): string {
  return `${Math.round(bytes / 1048576)} MB`;
}

// Async server component: reads the latest release at request time (cached).
export async function DesktopDownload() {
  const release = await getLatestDesktopRelease();

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Get the desktop app</h3>
      <p className="mt-1 text-sm text-slate-600">
        A tray timer for Windows that syncs with your account — start/stop from the tray,
        automatic idle detection, and an always-on-top mini timer. Create a token below, then
        paste it into the app.
      </p>

      {release && release.assets.length > 0 ? (
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
