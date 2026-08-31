import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  GraduationCap,
  Lock,
  RotateCcw,
  Shield,
  Sparkles,
  XCircle,
  Zap,
  Globe,
  Users,
  Briefcase,
  ShoppingBag,
  TrendingUp,
  Target,
  Phone,
  Award,
  Building2,
  Layers,
  ArrowRightCircle,
  BookOpenText,
  Clock,
  Calendar,
  FileText,
  Mail,
  MessageCircle,
  Star,
  Heart,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEmployeeSession } from "@/lib/employee-session";
import {
  categoryTone,
  programCompletion,
  scoreQuiz,
  useTrainingProgress,
  useTrainingPrograms,
  type TrainingCard,
  type TrainingProgram,
  type TrainingStep,
} from "@/lib/training-store";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  globe: Globe,
  shield: Shield,
  users: Users,
  briefcase: Briefcase,
  "shopping-bag": ShoppingBag,
  "trending-up": TrendingUp,
  target: Target,
  phone: Phone,
  award: Award,
  building: Building2,
  layers: Layers,
  "arrow-right": ArrowRightCircle,
  "book-open": BookOpenText,
  clock: Clock,
  calendar: Calendar,
  "file-text": FileText,
  mail: Mail,
  "message-circle": MessageCircle,
  star: Star,
  heart: Heart,
  search: Search,
  filter: Filter,
  "more-horizontal": MoreHorizontal,
};

export const Route = createFileRoute("/me/training")({
  head: () => ({
    meta: [
      { title: "Training & Orientation — OmniWork" },
      {
        name: "description",
        content:
          "Step-by-step orientation guides and quiz sessions to complete your OmniWork training.",
      },
      { property: "og:title", content: "Training & Orientation — OmniWork" },
      {
        property: "og:description",
        content: "Complete your orientation step by step and answer the quiz for each module.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { employee, name } = useEmployeeSession();
  const { programs } = useTrainingPrograms();
  const { progress, recordStep, resetProgram } = useTrainingProgress(employee.id);
  const [openId, setOpenId] = useState<string | null>(null);

  const active = programs.find((p) => p.id === openId) ?? null;
  const progressFor = (programId: string) => progress.find((p) => p.programId === programId);

  const overall = useMemo(() => {
    if (!programs.length) return 0;
    const sum = programs.reduce(
      (acc, p) => acc + programCompletion(p, progressFor(p.id)),
      0,
    );
    return Math.round(sum / programs.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs, progress]);

  return (
    <EmployeeShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Training & Orientation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Work through each module step by step, then answer the questions to complete it.
            </p>
          </div>
          {active && (
            <Button variant="outline" onClick={() => setOpenId(null)}>
              <ArrowLeft className="size-4" /> All programs
            </Button>
          )}
        </div>

        {!active && (
          <>
            <Card className="overflow-hidden border-primary/25 bg-primary/5">
              <CardContent className="flex flex-wrap items-center gap-6 p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <GraduationCap className="size-6" />
                </div>
                <div className="min-w-56 flex-1">
                  <p className="text-sm font-medium">Welcome aboard, {name}</p>
                  <p className="text-sm text-muted-foreground">
                    Your overall training completion across {programs.length} programs.
                  </p>
                  <Progress value={overall} className="mt-3 h-2" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold tracking-tight">{overall}%</p>
                  <p className="text-xs text-muted-foreground">complete</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {programs.map((program) => {
                const pct = programCompletion(program, progressFor(program.id));
                return (
                  <Card key={program.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base">{program.title}</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn("shrink-0 ring-1", categoryTone[program.category])}
                        >
                          {program.category}
                        </Badge>
                      </div>
                      <CardDescription>{program.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <BookOpen className="size-3.5" />
                        {program.steps.length} steps
                        <span>•</span>
                        pass mark {program.passMark}%
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => setOpenId(program.id)}>
                          {pct === 0 ? "Start" : pct === 100 ? "Review" : "Continue"}
                          <ArrowRight className="size-4" />
                        </Button>
                        {pct > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reset my progress"
                            onClick={() => {
                              resetProgram(employee.id, program.id);
                              toast.success("Progress reset");
                            }}
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {active && (
          <ProgramRunner
            key={active.id}
            program={active}
            employeeId={employee.id}
            completedSteps={Object.entries(progressFor(active.id)?.steps ?? {})
              .filter(([, s]) => s.completedAt)
              .map(([id]) => id)}
            onRecord={recordStep}
          />
        )}
      </div>
    </EmployeeShell>
  );
}

function ProgramRunner({
  program,
  employeeId,
  completedSteps,
  onRecord,
}: {
  program: TrainingProgram;
  employeeId: string;
  completedSteps: string[];
  onRecord: ReturnType<typeof useTrainingProgress>["recordStep"];
}) {
  const firstIncomplete = Math.max(
    0,
    program.steps.findIndex((s) => !completedSteps.includes(s.id)),
  );
  const [index, setIndex] = useState(firstIncomplete);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [sessionDone, setSessionDone] = useState(
    completedSteps.includes(program.steps[firstIncomplete]?.id ?? ""),
  );
  const unlockedUpTo = program.steps.findIndex((s) => !completedSteps.includes(s.id));
  const maxUnlocked = unlockedUpTo === -1 ? program.steps.length - 1 : unlockedUpTo;

  const step = program.steps[index];
  if (!step) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          This program has no steps yet.
        </CardContent>
      </Card>
    );
  }

  const answered = step.questions.every((q) => answers[q.id] !== undefined);
  const score = scoreQuiz(step, answers);
  const passed = checked && score >= program.passMark;
  const done = completedSteps.includes(step.id);

  const submit = () => {
    const s = scoreQuiz(step, answers);
    setChecked(true);
    onRecord(
      employeeId,
      program.id,
      step.id,
      answers,
      s,
      program.steps.map((x) => x.id),
      program.passMark,
    );
    if (s >= program.passMark) toast.success(`Step passed — ${s}%`);
    else toast.error(`Score ${s}% — review the guide and try again`);
  };

  const goto = (i: number) => {
    if (i > maxUnlocked) {
      toast.error("Finish the current step first");
      return;
    }
    setIndex(i);
    setAnswers({});
    setChecked(false);
    setSessionDone(completedSteps.includes(program.steps[i]?.id ?? ""));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm">{program.title}</CardTitle>
          <CardDescription>{program.audience}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {program.steps.map((s, i) => {
            const isDone = completedSteps.includes(s.id);
            const locked = i > maxUnlocked;
            return (
              <button
                key={s.id}
                onClick={() => goto(i)}
                disabled={locked}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  locked && "cursor-not-allowed opacity-45",
                  i === index
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                ) : locked ? (
                  <Lock className="mt-0.5 size-4 shrink-0 opacity-50" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 opacity-50" />
                )}
                <span>
                  {s.title}
                  <span className="block text-xs opacity-70">{s.duration}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-primary/5 px-6 py-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                Step {index + 1} of {program.steps.length}
              </span>
              <span>{step.duration}</span>
              {done && (
                <Badge variant="outline" className="ring-1 ring-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  Completed
                </Badge>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">{step.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{step.summary}</p>
            <Progress
              value={((index + (done ? 1 : 0)) / program.steps.length) * 100}
              className="mt-4 h-1.5"
            />
          </div>
          <CardContent className="pt-6">
            {step.cards ? (
              <BentoGuide
                cards={step.cards}
                done={done}
                sessionDone={sessionDone}
                onSessionDone={() => {
                  setSessionDone(true);
                  if (step.questions.length === 0) {
                    onRecord(
                      employeeId,
                      program.id,
                      step.id,
                      {},
                      100,
                      program.steps.map((x) => x.id),
                      program.passMark,
                    );
                    toast.success("Step completed");
                  }
                }}
              />
            ) : (
              <ul className="grid gap-3">
                {step.points.map((p, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-foreground/85">{p}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              {done ? (
                <span className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" /> Step completed
                </span>
              ) : sessionDone ? (
                step.questions.length === 0 ? (
                  <span className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" /> Session finished — step completed
                  </span>
                ) : (
                  <span className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" /> Session finished — answer the questions below
                  </span>
                )
              ) : step.cards ? (
                <span className="text-xs text-muted-foreground">
                  Review the cards above, then click the action tile to finish this session.
                </span>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => {
                      setSessionDone(true);
                      if (step.questions.length === 0) {
                        onRecord(
                          employeeId,
                          program.id,
                          step.id,
                          {},
                          100,
                          program.steps.map((x) => x.id),
                          program.passMark,
                        );
                        toast.success("Step completed");
                      }
                    }}
                  >
                    <CheckCircle2 className="size-4" /> Session finished
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {step.questions.length === 0
                      ? "Read the full guide, then confirm to complete this step."
                      : "Read the full guide, then confirm to unlock the Q&A for this step."}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {sessionDone && step.questions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <CardTitle className="text-base">Question & answer session</CardTitle>
              </div>
              <CardDescription>
                Answer every question — {program.passMark}% or higher completes this step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step.questions.map((q, qi) => {
                const chosen = answers[q.id];
                return (
                  <div key={q.id} className="rounded-xl border border-border p-4">
                    <p className="text-sm font-medium">
                      {qi + 1}. {q.prompt}
                    </p>
                    <RadioGroup
                      className="mt-3 space-y-2"
                      value={chosen === undefined ? "" : String(chosen)}
                      onValueChange={(v) => {
                        setAnswers((a) => ({ ...a, [q.id]: Number(v) }));
                        setChecked(false);
                      }}
                    >
                      {q.options.map((opt, oi) => {
                        const state =
                          checked && oi === q.answer
                            ? "correct"
                            : checked && chosen === oi
                              ? "wrong"
                              : "idle";
                        return (
                          <div
                            key={oi}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                              state === "correct" && "border-emerald-500/40 bg-emerald-500/10",
                              state === "wrong" && "border-destructive/40 bg-destructive/10",
                              state === "idle" &&
                                "border-border/70 bg-muted/30 hover:border-primary/30 hover:bg-primary/5",
                            )}
                          >
                            <RadioGroupItem value={String(oi)} id={`${q.id}-${oi}`} />
                            <Label htmlFor={`${q.id}-${oi}`} className="flex-1 cursor-pointer font-normal">
                              {opt}
                            </Label>
                            {state === "correct" && <CheckCircle2 className="size-4 text-emerald-500" />}
                            {state === "wrong" && <XCircle className="size-4 text-destructive" />}
                          </div>
                        );
                      })}
                    </RadioGroup>
                    {checked && q.explanation && (
                      <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>
                    )}
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={submit} disabled={!answered}>
                  Submit answers
                </Button>
                {checked && (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      passed ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                    )}
                  >
                    Score {score}% — {passed ? "step completed" : `needs ${program.passMark}%`}
                  </span>
                )}
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" disabled={index === 0} onClick={() => goto(index - 1)}>
                    <ArrowLeft className="size-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={index === program.steps.length - 1 || index + 1 > maxUnlocked}
                    onClick={() => goto(index + 1)}
                  >
                    Next <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
