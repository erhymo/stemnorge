"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminIssueDraft, DraftGenerationSource } from "@/lib/admin-issue-draft";
import { toAdminIssueSlug } from "@/lib/admin-issue-draft";
import {
  ISSUE_ARGUMENT_MIN_LENGTH,
  ISSUE_BACKGROUND_MIN_LENGTH,
  ISSUE_OVERVIEW_MIN_LENGTH,
} from "@/lib/issue-text-guidelines";

export type AdminIssueFormValues = {
  title: string;
  slug: string;
  question: string;
  overview: string;
  background: string;
  argumentFor: string;
  argumentAgainst: string;
  supportLabel: string;
  opposeLabel: string;
  publishedAt: string;
  closesAt: string;
};

type AdminIssueFormProps = {
  mode?: "create" | "edit";
  issueId?: number;
  initialValues?: Partial<AdminIssueFormValues>;
  onCancel?: () => void;
  onSuccess?: (message: string) => void;
};

export function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getDefaultFormValues(): AdminIssueFormValues {
  const now = new Date();
  const nextMonday = new Date(now);
  const daysUntilMonday = ((8 - nextMonday.getDay()) % 7) || 7;

  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(6, 0, 0, 0);

  const closesAt = new Date(nextMonday);
  closesAt.setDate(closesAt.getDate() + 6);
  closesAt.setHours(18, 0, 0, 0);

  return {
    title: "",
    slug: "",
    question: "",
    overview: "",
    background: "",
    argumentFor: "",
    argumentAgainst: "",
    supportLabel: "For",
    opposeLabel: "Mot",
    publishedAt: toDatetimeLocalValue(nextMonday),
    closesAt: toDatetimeLocalValue(closesAt),
  };
}

function getInitialFormValues(initialValues?: Partial<AdminIssueFormValues>): AdminIssueFormValues {
  return {
    ...getDefaultFormValues(),
    ...initialValues,
  };
}

function applyGeneratedDraft(current: AdminIssueFormValues, draft: AdminIssueDraft, slugTouched: boolean): AdminIssueFormValues {
  return {
    ...current,
    title: draft.title,
    slug: slugTouched ? current.slug : draft.slug,
    question: draft.question,
    overview: draft.overview,
    background: draft.background,
    argumentFor: draft.argumentFor,
    argumentAgainst: draft.argumentAgainst,
    supportLabel: draft.supportLabel,
    opposeLabel: draft.opposeLabel,
  };
}

function getTextLength(value: string) {
  return value.trim().length;
}

function getLengthHintClassName(length: number, minLength: number) {
  return length < minLength ? "text-amber-300" : "text-emerald-300";
}

export default function AdminIssueForm({ mode = "create", issueId, initialValues, onCancel, onSuccess }: AdminIssueFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit" && typeof issueId === "number";
  const [values, setValues] = useState<AdminIssueFormValues>(() => getInitialFormValues(initialValues));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [draftTopic, setDraftTopic] = useState("");
  const [draftContext, setDraftContext] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<K extends keyof AdminIssueFormValues>(field: K, value: AdminIssueFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleGenerateDraft() {
    if (!draftTopic.trim()) {
      setDraftMessage("Beskriv temaet først for å generere et utkast.");
      return;
    }

    setDraftMessage("");
    setMessage("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/admin/issues/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: draftTopic, context: draftContext }),
      });

      const data = (await res.json()) as { draft?: AdminIssueDraft; source?: DraftGenerationSource; error?: string };

      if (!res.ok || !data.draft) {
        setDraftMessage(data.error || "Kunne ikke generere utkast.");
        return;
      }

      setValues((current) => applyGeneratedDraft(current, data.draft as AdminIssueDraft, slugTouched));
      setDraftMessage(
        data.source === "openai"
          ? "OpenAI-utkastet er lagt inn i skjemaet. Gå gjennom feltene og juster før du lagrer saken."
          : "OpenAI var ikke tilgjengelig, så reserveutkastet ble lagt inn i skjemaet. Gå gjennom feltene ekstra nøye før du lagrer saken.",
      );
    } catch {
      setDraftMessage("Noe gikk galt under generering av utkast.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch(isEditMode ? `/api/admin/issues/${issueId}` : "/api/admin/issues", {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || (isEditMode ? "Kunne ikke oppdatere saken." : "Kunne ikke opprette saken."));
        return;
      }

      const successMessage = isEditMode ? `Saken ble oppdatert som ${data.issue.slug}.` : `Saken ble opprettet som ${data.issue.slug}.`;

      setMessage(successMessage);

      if (!isEditMode) {
        setValues(getInitialFormValues());
        setSlugTouched(false);
        setDraftTopic("");
        setDraftContext("");
        setDraftMessage("");
      }

      router.refresh();
      onSuccess?.(successMessage);
    } catch {
      setMessage(isEditMode ? "Noe gikk galt under oppdatering av saken." : "Noe gikk galt under opprettelse av saken.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const eyebrow = isEditMode ? "Redigering" : "Manuell opprettelse";
  const heading = isEditMode ? "Rediger planlagt sak" : "Planlegg en ny sak";
  const description = isEditMode
    ? "Bare planlagte saker kan endres. Oppdateringene må fortsatt holde seg innenfor et gyldig tidsvindu."
    : "Start gjerne med et AI-utkast, men gå alltid gjennom feltene manuelt. Tidsvinduet må ikke overlappe med eksisterende saker, og tekstene bør være forklarende nok til at velgeren lærer noe av å lese dem.";
  const submitLabel = isEditMode ? "Lagre endringer" : "Opprett og planlegg sak";
  const submittingLabel = isEditMode ? "Lagrer endringer..." : "Oppretter sak...";
  const overviewLength = getTextLength(values.overview);
  const backgroundLength = getTextLength(values.background);
  const argumentForLength = getTextLength(values.argumentFor);
  const argumentAgainstLength = getTextLength(values.argumentAgainst);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/40">
      <div className="mb-6 space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">{eyebrow}</p>
        <h2 className="text-2xl text-white">{heading}</h2>
        <p className="text-sm leading-7 text-slate-400">{description}</p>
      </div>

      {!isEditMode ? (
        <div className="mb-6 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-400/5 p-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">AI-utkast</p>
            <h3 className="text-lg text-white">Generer et førsteutkast før du planlegger saken</h3>
            <p className="text-sm leading-7 text-slate-300">
              Skriv temaet du vil utforske, eventuelt med litt ekstra kontekst. Utkastet fyller inn feltene under, men lagres ikke før du trykker på opprett.
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="block">Tema</span>
              <input
                type="text"
                value={draftTopic}
                onChange={(event) => setDraftTopic(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
                placeholder="For eksempel: atomkraft i Norge"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block">Ekstra kontekst (valgfritt)</span>
              <textarea
                value={draftContext}
                onChange={(event) => setDraftContext(event.target.value)}
                rows={3}
                className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
                placeholder="Nevn gjerne hensyn som kostnader, konsekvenser eller risiko."
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isGenerating || isSubmitting}
                className="rounded-full border border-cyan-300/40 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGenerating ? "Genererer utkast..." : "Generer med AI"}
              </button>
              <p className="text-xs leading-6 text-slate-400">Utkastet er kun et arbeidsgrunnlag og bør kvalitetssikres før publisering. Sikt på tydelige avsnitt og litt mer dybde enn før.</p>
            </div>

            {draftMessage ? <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{draftMessage}</p> : null}
          </div>
        </div>
      ) : null}

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Tittel</span>
            <input type="text" value={values.title} onChange={(event) => {
              const title = event.target.value;
              updateValue("title", title);
              if (!slugTouched) {
                updateValue("slug", toAdminIssueSlug(title));
              }
            }} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7" placeholder="Kort tittel for saken" />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Slug</span>
            <input type="text" value={values.slug} onChange={(event) => {
              setSlugTouched(true);
              updateValue("slug", toAdminIssueSlug(event.target.value));
            }} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7" placeholder="genereres-fra-tittel" />
          </label>
        </div>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="block">Spørsmål</span>
          <input type="text" value={values.question} onChange={(event) => updateValue("question", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7" placeholder="Skal Norge ...?" />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Publiseres</span>
            <input type="datetime-local" value={values.publishedAt} onChange={(event) => updateValue("publishedAt", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/7" />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Lukkes</span>
            <input type="datetime-local" value={values.closesAt} onChange={(event) => updateValue("closesAt", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/7" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Label for støtte</span>
            <input type="text" value={values.supportLabel} onChange={(event) => updateValue("supportLabel", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/7" />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Label for motstand</span>
            <input type="text" value={values.opposeLabel} onChange={(event) => updateValue("opposeLabel", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/7" />
          </label>
        </div>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="block">Kort oversikt</span>
          <textarea value={values.overview} onChange={(event) => updateValue("overview", event.target.value)} rows={4} className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7" placeholder="Kort ingress som forklarer hva saken gjelder." />
          <p className={`text-xs leading-6 ${getLengthHintClassName(overviewLength, ISSUE_OVERVIEW_MIN_LENGTH)}`}>
            Nå: {overviewLength} tegn · minimum {ISSUE_OVERVIEW_MIN_LENGTH} tegn.
          </p>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="block">Bakgrunn</span>
          <textarea value={values.background} onChange={(event) => updateValue("background", event.target.value)} rows={10} className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-cyan-300/40 focus:bg-white/7" placeholder="Gi nok kontekst til at velgeren forstår saken." />
          <p className={`text-xs leading-6 ${getLengthHintClassName(backgroundLength, ISSUE_BACKGROUND_MIN_LENGTH)}`}>
            Nå: {backgroundLength} tegn · minimum {ISSUE_BACKGROUND_MIN_LENGTH} tegn. Skriv gjerne 2–4 korte avsnitt.
          </p>
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Argument for</span>
            <textarea value={values.argumentFor} onChange={(event) => updateValue("argumentFor", event.target.value)} rows={9} className="w-full rounded-[1.5rem] border border-emerald-300/15 bg-emerald-400/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-300/40 focus:bg-emerald-400/10" placeholder="Hva er hovedargumentet for forslaget?" />
            <p className={`text-xs leading-6 ${getLengthHintClassName(argumentForLength, ISSUE_ARGUMENT_MIN_LENGTH)}`}>
              Nå: {argumentForLength} tegn · minimum {ISSUE_ARGUMENT_MIN_LENGTH} tegn. Forklar gjerne i 2–3 korte avsnitt.
            </p>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block">Argument mot</span>
            <textarea value={values.argumentAgainst} onChange={(event) => updateValue("argumentAgainst", event.target.value)} rows={9} className="w-full rounded-[1.5rem] border border-rose-300/15 bg-rose-400/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-rose-300/40 focus:bg-rose-400/10" placeholder="Hva er hovedargumentet mot forslaget?" />
            <p className={`text-xs leading-6 ${getLengthHintClassName(argumentAgainstLength, ISSUE_ARGUMENT_MIN_LENGTH)}`}>
              Nå: {argumentAgainstLength} tegn · minimum {ISSUE_ARGUMENT_MIN_LENGTH} tegn. Forklar gjerne i 2–3 korte avsnitt.
            </p>
          </label>
        </div>

        <div className="mt-2 flex flex-wrap gap-3">
          <button type="submit" disabled={isSubmitting} className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? submittingLabel : submitLabel}
          </button>

          {isEditMode && onCancel ? (
            <button type="button" onClick={onCancel} className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white">
              Avbryt
            </button>
          ) : null}
        </div>
      </form>

      {message && <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</p>}
    </section>
  );
}