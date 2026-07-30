import Anthropic from "@anthropic-ai/sdk";

/**
 * AI weekly summary.
 *
 * Turns a week of tracked time into a short written recap. The feature is
 * optional: without ANTHROPIC_API_KEY the rest of the app is unaffected and the
 * UI simply says the summary is unavailable, rather than erroring.
 */

export type WeeklySummaryInput = {
  weekLabel: string;
  workedSeconds: number;
  idleSeconds: number;
  /** Per-project totals, largest first. */
  projects: { name: string; seconds: number }[];
  /** Per-day worked totals, Monday first. */
  days: { label: string; seconds: number }[];
  entryCount: number;
};

export type WeeklySummaryResult =
  | { status: "ok"; summary: string }
  | { status: "disabled"; message: string }
  | { status: "error"; message: string };

/** Whether the feature is configured. Checked before any UI is rendered. */
export function isAiSummaryEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const hm = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/** The facts the model is allowed to talk about, as compact text. */
function buildFacts(input: WeeklySummaryInput): string {
  const projects = input.projects.length
    ? input.projects.map((p) => `- ${p.name}: ${hm(p.seconds)}`).join("\n")
    : "- (no project time)";
  const days = input.days.map((d) => `- ${d.label}: ${hm(d.seconds)}`).join("\n");

  return [
    `Week: ${input.weekLabel}`,
    `Total worked: ${hm(input.workedSeconds)}`,
    `Idle time subtracted: ${hm(input.idleSeconds)}`,
    `Time entries: ${input.entryCount}`,
    "",
    "By project:",
    projects,
    "",
    "By day:",
    days,
  ].join("\n");
}

const SYSTEM = `You write a short weekly recap for someone reviewing their own tracked time in a time-tracking app.

Write 2-4 sentences of plain prose. No headings, no bullet points, no preamble.

Ground every statement in the figures you are given - name the actual projects and durations. Do not invent tasks, teammates, deadlines, or reasons. If the data is thin, say so briefly rather than padding.

You may note a concrete pattern that is visible in the numbers (for example most time landing on one project, or a day with no tracked time). Do not evaluate the person's productivity, and do not give advice unless the numbers clearly support it.`;

/**
 * Generate the recap. Never throws - callers render whatever comes back.
 */
export async function generateWeeklySummary(
  input: WeeklySummaryInput
): Promise<WeeklySummaryResult> {
  if (!isAiSummaryEnabled()) {
    return {
      status: "disabled",
      message: "Set ANTHROPIC_API_KEY to enable AI weekly summaries.",
    };
  }

  if (input.workedSeconds === 0) {
    return { status: "disabled", message: "No time tracked this week yet." };
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      // A short recap over a handful of numbers does not need deep reasoning;
      // low effort keeps this fast and cheap. Thinking stays on - disabling it
      // is what causes stray reasoning to leak into the visible response.
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: buildFacts(input) }],
    });

    if (response.stop_reason === "refusal") {
      return { status: "error", message: "The summary could not be generated." };
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return text
      ? { status: "ok", summary: text }
      : { status: "error", message: "The summary came back empty." };
  } catch (err) {
    // Surface a short reason but keep provider details out of the UI.
    if (err instanceof Anthropic.RateLimitError) {
      return { status: "error", message: "Rate limited - try again shortly." };
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return { status: "error", message: "ANTHROPIC_API_KEY is not valid." };
    }
    console.error("weekly summary failed", err);
    return { status: "error", message: "Could not generate a summary right now." };
  }
}
