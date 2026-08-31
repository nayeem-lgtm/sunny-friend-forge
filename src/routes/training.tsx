import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, GraduationCap, ListChecks, Plus, RotateCcw, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { activeEmployees, fullName } from "@/lib/employee-session";
import {
  categoryTone,
  programCompletion,
  trainingCategories,
  useTrainingProgress,
  useTrainingPrograms,
  type TrainingCategory,
} from "@/lib/training-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Training & Orientation — OmniWork" },
      {
        name: "description",
        content:
          "Build step-by-step orientation programs with quizzes and track employee training completion.",
      },
      { property: "og:title", content: "Training & Orientation — OmniWork" },
      {
        property: "og:description",
        content: "Create training modules, add Q&A sessions and monitor team completion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const {
    programs,
    addProgram,
    removeProgram,
    addStep,
    removeStep,
    addQuestion,
    removeQuestion,
    reset,
  } = useTrainingPrograms();
  const { allProgress } = useTrainingProgress();

  const [programOpen, setProgramOpen] = useState(false);
  const [stepFor, setStepFor] = useState<string | null>(null);
  const [questionFor, setQuestionFor] = useState<{ program: string; step: string } | null>(null);

  const totalSteps = programs.reduce((a, p) => a + p.steps.length, 0);
  const totalQuestions = programs.reduce(
    (a, p) => a + p.steps.reduce((b, s) => b + s.questions.length, 0),
    0,
  );

  const rows = useMemo(
    () =>
      activeEmployees.map((e) => {
        const pcts = programs.map((p) =>
          programCompletion(
            p,
            allProgress.find((x) => x.employeeId === e.id && x.programId === p.id),
          ),
        );
        const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        return { employee: e, pcts, avg };
      }),
    [programs, allProgress],
  );

  const completedCount = rows.filter((r) => r.avg === 100).length;

  return (
    <AppShell>
      <PageHeader
        title="Training & Orientation"
        description="Design step-by-step onboarding guides with question & answer sessions, and track who has completed them."
        actions={
          <>
            <Button variant="outline" onClick={() => { reset(); toast.success("Programs restored"); }}>
              <RotateCcw className="size-4" /> Restore defaults
            </Button>
            <Button onClick={() => setProgramOpen(true)}>
              <Plus className="size-4" /> New program
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Programs" value={String(programs.length)} icon={GraduationCap} />
        <StatCard label="Guide steps" value={String(totalSteps)} icon={BookOpen} />
        <StatCard label="Quiz questions" value={String(totalQuestions)} icon={ListChecks} />
        <StatCard
          title="Fully trained"
          value={`${completedCount}/${rows.length}`}
          icon={Users2}
        />
      </div>

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="progress">Employee progress</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-4 space-y-4">
          {programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{program.title}</CardTitle>
                      <Badge variant="outline" className={cn("ring-1", categoryTone[program.category])}>
                        {program.category}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">{program.description}</CardDescription>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {program.audience} • pass mark {program.passMark}% • {program.steps.length} steps
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setStepFor(program.id)}>
                      <Plus className="size-4" /> Add step
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeProgram(program.id);
                        toast.success("Program removed");
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {program.steps.map((step, i) => (
                    <AccordionItem key={step.id} value={step.id}>
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-3">
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
                            {i + 1}
                          </span>
                          {step.title}
                          <span className="text-xs font-normal text-muted-foreground">
                            {step.duration} • {step.questions.length} questions
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{step.summary}</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {step.points.map((p, pi) => (
                            <li key={pi}>{p}</li>
                          ))}
                        </ul>
                        <div className="space-y-2">
                          {step.questions.map((q) => (
                            <div
                              key={q.id}
                              className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                            >
                              <div className="text-sm">
                                <p className="font-medium">{q.prompt}</p>
                                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                  {q.options.map((o, oi) => (
                                    <li
                                      key={oi}
                                      className={cn(oi === q.answer && "font-medium text-emerald-600 dark:text-emerald-400")}
                                    >
                                      {oi === q.answer ? "✓" : "•"} {o}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeQuestion(program.id, step.id, q.id)}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setQuestionFor({ program: program.id, step: step.id })}
                          >
                            <Plus className="size-4" /> Add question
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              removeStep(program.id, step.id);
                              toast.success("Step removed");
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" /> Remove step
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {program.steps.length === 0 && (
                  <p className="text-sm text-muted-foreground">No steps yet — add the first one.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Department</th>
                      {programs.map((p) => (
                        <th key={p.id} className="px-4 py-3">
                          {p.title}
                        </th>
                      ))}
                      <th className="px-4 py-3">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ employee, pcts, avg }) => (
                      <tr key={employee.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3 font-medium">{fullName(employee)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{employee.department}</td>
                        {pcts.map((pct, i) => (
                          <td key={i} className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-1.5 w-20" />
                              <span className="text-xs text-muted-foreground">{pct}%</span>
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "ring-1",
                              avg === 100
                                ? "text-emerald-600 ring-emerald-500/30 dark:text-emerald-400"
                                : avg === 0
                                  ? "text-muted-foreground ring-border"
                                  : "text-amber-600 ring-amber-500/30 dark:text-amber-400",
                            )}
                          >
                            {avg}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewProgramDialog open={programOpen} onOpenChange={setProgramOpen} onCreate={addProgram} />
      <NewStepDialog
        programId={stepFor}
        onClose={() => setStepFor(null)}
        onCreate={(id, step) => addStep(id, step)}
      />
      <NewQuestionDialog
        target={questionFor}
        onClose={() => setQuestionFor(null)}
        onCreate={(t, q) => addQuestion(t.program, t.step, q)}
      />
    </AppShell>
  );
}

function NewProgramDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: ReturnType<typeof useTrainingPrograms>["addProgram"];
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TrainingCategory>("Orientation");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("All employees");
  const [passMark, setPassMark] = useState("70");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New training program</DialogTitle>
          <DialogDescription>Create a program, then add its guide steps and questions.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Client Handling Basics" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TrainingCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trainingCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pass mark (%)</Label>
              <Input value={passMark} onChange={(e) => setPassMark(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!title.trim()) { toast.error("Add a title"); return; }
              onCreate({
                title: title.trim(),
                category,
                description: description.trim(),
                audience: audience.trim() || "All employees",
                passMark: Math.min(100, Math.max(0, Number(passMark) || 70)),
              });
              setTitle("");
              setDescription("");
              onOpenChange(false);
              toast.success("Program created");
            }}
          >
            Create program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewStepDialog({
  programId,
  onClose,
  onCreate,
}: {
  programId: string | null;
  onClose: () => void;
  onCreate: (programId: string, step: { title: string; duration: string; summary: string; points: string[] }) => void;
}) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("10 min");
  const [summary, setSummary] = useState("");
  const [points, setPoints] = useState("");

  return (
    <Dialog open={!!programId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add guide step</DialogTitle>
          <DialogDescription>Each step is one part of the step-by-step guide.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <Label>Step title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Summary</Label>
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Key points (one per line)</Label>
            <Textarea value={points} onChange={(e) => setPoints(e.target.value)} rows={5} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!programId || !title.trim()) { toast.error("Add a step title"); return; }
              onCreate(programId, {
                title: title.trim(),
                duration: duration.trim() || "10 min",
                summary: summary.trim(),
                points: points.split("\n").map((p) => p.trim()).filter(Boolean),
              });
              setTitle("");
              setSummary("");
              setPoints("");
              onClose();
              toast.success("Step added");
            }}
          >
            Add step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewQuestionDialog({
  target,
  onClose,
  onCreate,
}: {
  target: { program: string; step: string } | null;
  onClose: () => void;
  onCreate: (
    t: { program: string; step: string },
    q: { prompt: string; options: string[]; answer: number; explanation?: string },
  ) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("0");
  const [explanation, setExplanation] = useState("");

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add question</DialogTitle>
          <DialogDescription>Multiple choice — mark the correct option.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((o, i) => (
              <Input
                key={i}
                value={o}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => setOptions((prev) => prev.map((p, pi) => (pi === i ? e.target.value : p)))}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label>Correct answer</Label>
            <Select value={answer} onValueChange={setAnswer}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((o, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {o.trim() || `Option ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Explanation (optional)</Label>
            <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const opts = options.map((o) => o.trim()).filter(Boolean);
              if (!target || !prompt.trim() || opts.length < 2) {
                toast.error("Add a question and at least two options");
                return;
              }
              onCreate(target, {
                prompt: prompt.trim(),
                options: opts,
                answer: Math.min(Number(answer), opts.length - 1),
                ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
              });
              setPrompt("");
              setOptions(["", "", "", ""]);
              setAnswer("0");
              setExplanation("");
              onClose();
              toast.success("Question added");
            }}
          >
            Add question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
