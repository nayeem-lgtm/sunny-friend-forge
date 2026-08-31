import { useCallback, useEffect, useState } from "react";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  /** index of the correct option */
  answer: number;
  explanation?: string;
};

export type TrainingCard =
  | { type: "prose"; title?: string; paragraphs: string[] }
  | { type: "hero"; title: string; body: string; icon?: string }
  | { type: "stat"; value: string; label: string; sublabel?: string }
  | {
      type: "divisions";
      title?: string;
      items: { number: string; label: string; description?: string }[];
    }
  | {
      type: "flow";
      title?: string;
      intro?: string;
      stages: {
        label: string;
        sublabel?: string;
        tags?: string[];
        icon?: string;
      }[];
    }
  | {
      type: "verticals";
      title?: string;
      intro?: string;
      items: {
        number: string;
        label: string;
        icon?: string;
        points: string[];
      }[];
    }
  | { type: "info"; title: string; body: string; icon?: string; badge?: string }
  | { type: "action"; label: string; icon?: string };

export type TrainingStep = {
  id: string;
  title: string;
  duration: string;
  summary: string;
  /** bullet points shown as the guide body */
  points: string[];
  /** optional visual bento cards — when present they replace the bullet list */
  cards?: TrainingCard[];
  questions: QuizQuestion[];
};

export type TrainingCategory = "Orientation" | "Compliance" | "Skills" | "Tools";

export type TrainingProgram = {
  id: string;
  title: string;
  category: TrainingCategory;
  description: string;
  audience: string;
  /** minimum % of correct answers required to pass each quiz */
  passMark: number;
  steps: TrainingStep[];
};

export type StepProgress = {
  /** answers by question id → chosen option index */
  answers: Record<string, number>;
  score: number;
  completedAt?: string;
};

export type ProgramProgress = {
  employeeId: string;
  programId: string;
  steps: Record<string, StepProgress>;
  startedAt: string;
  completedAt?: string;
};

export const trainingCategories: TrainingCategory[] = [
  "Orientation",
  "Compliance",
  "Skills",
  "Tools",
];

export const categoryTone: Record<TrainingCategory, string> = {
  Orientation: "bg-primary/15 text-primary ring-primary/30",
  Compliance: "bg-amber-500/15 text-amber-600 ring-amber-500/30 dark:text-amber-400",
  Skills: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
  Tools: "bg-violet-500/15 text-violet-600 ring-violet-500/30 dark:text-violet-400",
};

const PROGRAMS_KEY = "omniwork.training.programs.v13";
const PROGRESS_KEY = "omniwork.training.progress.v1";
const EVENT = "omniwork:training";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function defaultPrograms(): TrainingProgram[] {
  return [
    {
      id: "prog-orientation",
      title: "New Joiner Orientation",
      category: "Orientation",
      description:
        "Everything a new teammate needs in the first week — who we are, how we work and where to find help.",
      audience: "All new employees",
      passMark: 70,
      steps: [
        {
          id: "step-company-overview",
          title: "Company Overview",
          duration: "8 min",
          summary: "Company overview, business divisions, mission and vision.",
          points: [],
          cards: [
            {
              type: "prose",
              title: "Company Overview",
              paragraphs: [
                "Ray Advertising is a company with global operations, specializing in performance marketing, insurance, and e-commerce. Our ecosystem is designed to help leading U.S. businesses scale efficiently while meeting the insurance needs of American consumers. As a lead generation and performance marketing company, Ray Advertising connects America's top brands with high-intent customers who are ready to buy. We serve over 5,000 U.S. companies through Pay-Per-Call and lead generation solutions across insurance, home services, finance, and multiple other verticals. Through our subsidiary, Policy Bear, we further support American families by providing access to affordable health, auto, and life insurance solutions.",
              ],
            },
            {
              type: "divisions",
              title: "Business Divisions",
              items: [
                { number: "01", label: "Marketing Company" },
                { number: "02", label: "Insurance Agency" },
                { number: "03", label: "E-Commerce" },
              ],
            },
            {
              type: "prose",
              title: "Our Mission",
              paragraphs: [
                "Our mission is to become a trusted growth partner for businesses seeking to scale by delivering innovative, data-driven performance marketing solutions. We help leading U.S. companies connect with high-intent customers who are ready to take action, driving measurable results, sustainable revenue growth, and long-term business success.",
                "We are committed to building a reliable performance marketing ecosystem where results—not promises—drive success, powered by technology, data, innovation and strong partnerships.",
              ],
            },
            {
              type: "prose",
              title: "Our Vision",
              paragraphs: [
                "Our vision is to become one of the most respected and trusted performance marketing companies in the U.S. while creating a meaningful impact beyond revenue.",
                "A key part of our vision is to create quality career opportunities for talented individuals around the world, empowering them to develop valuable skills, build sustainable careers, and achieve financial independence.",
                "We aim to create a global, performance-driven ecosystem where people grow, businesses scale, and partnerships create lasting value through innovation, integrity, accountability, and collaboration.",
              ],
            },
            { type: "action", label: "Session finished", icon: "arrow-right" },
          ],
          questions: [],
        },

        {
          id: "step-core-services",
          title: "Our Core Services & How We Help U.S. Companies",
          duration: "15 min",
          summary: "The three services that drive performance and the complete value chain from consumer demand to qualified business opportunities.",
          points: [],
          cards: [
            {
              type: "prose",
              title: "Our Core Services",
              paragraphs: [
                "Ray Advertising delivers performance-driven marketing solutions through three core service lines: Media Buying, Lead Generation and Pay-Per-Call. Each service is built to connect U.S. businesses with high-intent customers and deliver measurable, profitable results.",
              ],
            },
            {
              type: "prose",
              title: "Media Buying",
              paragraphs: [
                "Performance-driven advertising that connects businesses with high-intent customers.",
                "Ray Advertising's expert media buying team manages advertising campaigns across leading digital channels to reach potential customers who are actively searching for products and services. We combine strategic targeting, creative testing, audience analysis, and continuous campaign optimization to maximize performance and generate measurable results for U.S. businesses.",
              ],
            },
            {
              type: "prose",
              title: "Lead Generation",
              paragraphs: [
                "Finding the right customers and turning their interest into actionable leads.",
                "Our lead generation solutions connect businesses with consumers who are actively interested in their products or services. We use targeted digital marketing strategies to attract high-intent prospects, capture their information with appropriate consent, and deliver qualified leads to businesses that are ready to engage with potential customers.",
              ],
            },
            {
              type: "prose",
              title: "Pay-Per-Call",
              paragraphs: [
                "Connecting businesses with customers through high-intent phone calls.",
                "Pay-Per-Call is a performance marketing model where businesses pay for qualified customer calls rather than simply paying for advertising exposure or clicks. Ray Advertising connects businesses with consumers who are actively seeking a specific product or service and are ready to speak with a representative.",
                "We focus on delivering relevant, high-intent calls based on campaign requirements, helping businesses turn customer demand into measurable opportunities and revenue.",
              ],
            },
            {
              type: "prose",
              title: "How Ray Advertising Helps U.S. Companies Get Real Customers",
              paragraphs: [
                "Ray Advertising combines media buying, lead generation, and Pay-Per-Call solutions to help U.S. businesses connect with consumers who are actively looking for their products and services.",
                "We don't simply generate traffic—we focus on finding high-intent consumers, validating their interest, and connecting them with businesses that are ready to serve them.",
              ],
            },
            {
              type: "prose",
              title: "1. Media Buying — We Find the Right Customers",
              paragraphs: [
                "Our in-house media buying team runs targeted advertising campaigns across digital channels to reach consumers who are actively searching for solutions.",
                "Through audience targeting, creative testing, campaign optimization, and performance analysis, we continuously work to identify high-intent traffic that has a genuine potential to convert into customers.",
                "Businesses get: High-intent consumers → Targeted traffic → More opportunities",
              ],
            },
            {
              type: "prose",
              title: "2. Lead Generation — We Turn Interest Into Qualified Leads",
              paragraphs: [
                "Once consumers show interest, our lead generation solutions help capture that demand and turn it into actionable leads.",
                "We focus on connecting businesses with consumers who have demonstrated interest in a specific product or service. Leads can be filtered and validated against campaign requirements before being delivered to the appropriate business.",
                "Businesses get: Consumer interest → Lead capture → Verification → Qualified leads",
              ],
            },
            {
              type: "prose",
              title: "3. Pay-Per-Call — We Connect Businesses With Ready-to-Talk Customers",
              paragraphs: [
                "For businesses where a phone conversation is the most valuable conversion, Ray Advertising connects high-intent consumers directly with businesses through Pay-Per-Call campaigns.",
                "Our call qualification process can evaluate factors such as intent, duration, geographic eligibility, and potential fraud signals according to campaign requirements. This helps businesses focus their resources on calls that meet their defined criteria.",
                "Businesses get: High-intent consumer → Qualified call → Business representative → Sales opportunity",
              ],
            },
            {
              type: "flow",
              title: "The Ray Advertising Advantage",
              intro: "We build the bridge between consumer demand and business growth.",
              stages: [
                {
                  label: "Consumers looking for help",
                  sublabel: "Active demand across digital channels",
                  icon: "users",
                },
                {
                  label: "Ray Advertising",
                  sublabel: "Media Buying + Lead Generation + Pay-Per-Call",
                  tags: ["Media Buying", "Lead Generation", "Pay-Per-Call"],
                  icon: "zap",
                },
                {
                  label: "Targeting & Qualification",
                  tags: [
                    "Intent",
                    "Verification",
                    "Quality",
                    "Fraud Monitoring",
                    "Campaign Requirements",
                  ],
                  icon: "shield",
                },
                {
                  label: "U.S. Businesses",
                  sublabel: "More qualified customer opportunities",
                  icon: "trending-up",
                },
              ],
            },
            {
              type: "prose",
              title: "Our goal is simple:",
              paragraphs: [
                "Find the right people. Qualify the opportunity. Connect them with the right business.",
                "This is stronger than saying “we generate leads” because it explains the complete value chain of Ray Advertising—from acquiring demand → qualifying it → delivering it to U.S. businesses.",
              ],
            },
            { type: "action", label: "Session finished", icon: "arrow-right" },
          ],
          questions: [],
        },

        {
          id: "step-verticals",
          title: "Verticals & Niches We Work In",
          duration: "10 min",
          summary:
            "The high-intent, performance-driven verticals Ray Advertising operates across.",
          points: [],
          cards: [
            {
              type: "verticals",
              title: "Verticals & Niches We Work In",
              intro:
                "Ray Advertising operates across a diverse range of high-intent, performance-driven verticals, enabling us to connect businesses with customers who are actively ready to convert.",
              items: [
                {
                  number: "1",
                  label: "Insurance",
                  icon: "shield",
                  points: [
                    "Health Insurance",
                    "Auto Insurance",
                    "Life Insurance",
                    "Home Insurance",
                    "etc.",
                  ],
                },
                {
                  number: "2",
                  label: "Home Services",
                  icon: "home",
                  points: ["Plumbing", "Roofing", "HVAC", "Gutter Services", "etc."],
                },
                {
                  number: "3",
                  label: "Financial Services",
                  icon: "landmark",
                  points: [
                    "Credit & Debt Relief",
                    "Tax & IRS Solutions",
                    "Mortgage Services",
                    "Real Estate",
                    "etc.",
                  ],
                },
                {
                  number: "4",
                  label: "Nutra & Wellness",
                  icon: "heart",
                  points: [
                    "Weight Loss Product",
                    "Supplements",
                    "Wellness Products",
                    "etc.",
                  ],
                },
                {
                  number: "5",
                  label: "Additional & Emerging Verticals",
                  icon: "file-plus",
                  points: [
                    "Gaming",
                    "Performance Verticals",
                    "Legal Services",
                    "Car Accident Attorneys",
                    "etc.",
                  ],
                },
              ],
            },
            { type: "action", label: "Session finished", icon: "arrow-right" },
          ],
          questions: [],
        },



        {
          id: "step-welcome",
          title: "Welcome to RAY Advertising",
          duration: "10 min",
          summary: "Our story, what we build and the teams you will work with every day.",
          points: [
            "RAY Advertising is a performance-first agency; OmniWork is our internal ERP for people, work and payroll.",
            "Departments: Admin, Media, IT, Affiliate, Business Development, QA and Accounting.",
            "Your line manager runs your weekly 1:1 — HR owns onboarding, payroll and leave.",
            "Company hours are 10:00–19:00 unless your schedule says otherwise.",
          ],
          questions: [
            {
              id: "q-welcome-1",
              prompt: "Which platform do you use for attendance, leave and payslips?",
              options: ["Email to HR", "OmniWork", "A shared spreadsheet", "Your manager's calendar"],
              answer: 1,
              explanation: "OmniWork is the single source of truth for all HR workflows.",
            },
            {
              id: "q-welcome-2",
              prompt: "Who owns onboarding, payroll and leave?",
              options: ["The IT department", "Your teammates", "HR", "The QA department"],
              answer: 2,
            },
          ],
        },
        {
          id: "step-attendance",
          title: "Attendance, worklogs and EOD reports",
          duration: "12 min",
          summary: "How your day is recorded and why the daily worklog matters.",
          points: [
            "Clock in from your dashboard when you start; the day closes automatically at logout.",
            "Submit an EOD worklog every working day — it feeds your KPI score.",
            "Two late arrivals count as one absent day.",
            "Three days of missing worklogs also count as one absent day.",
          ],
          questions: [
            {
              id: "q-att-1",
              prompt: "How many late arrivals equal one absent day?",
              options: ["Two", "Three", "Five", "Late arrivals are never counted"],
              answer: 0,
            },
            {
              id: "q-att-2",
              prompt: "How often should you submit a worklog?",
              options: ["Weekly", "Only when asked", "Every working day", "Monthly"],
              answer: 2,
            },
          ],
        },
        {
          id: "step-leave",
          title: "Leave and time off",
          duration: "8 min",
          summary: "Applying for PTO or unpaid leave, and handing over your work.",
          points: [
            "Two leave types exist: PTO and Unpaid.",
            "Maximum two days of leave per month — anything beyond needs HR approval in advance.",
            "If handover is required, pick the colleagues who will cover your tasks.",
            "Never take leave before it is approved: unauthorised absence after a rejection counts as two absents.",
          ],
          questions: [
            {
              id: "q-leave-1",
              prompt: "What is the standard monthly leave limit?",
              options: ["One day", "Two days", "Four days", "Unlimited"],
              answer: 1,
            },
            {
              id: "q-leave-2",
              prompt: "What does 'handover' mean on a leave request?",
              options: [
                "Returning your laptop",
                "Transferring your ongoing work to a teammate for your absence",
                "Signing a document at reception",
                "Nothing, it is optional paperwork",
              ],
              answer: 1,
            },
          ],
        },
        {
          id: "step-conduct",
          title: "Code of conduct and data security",
          duration: "10 min",
          summary: "How we treat each other, our clients and our data.",
          points: [
            "Treat every colleague and client with respect; harassment of any kind is a zero-tolerance issue.",
            "Client data never leaves approved company tools — no personal drives or messengers.",
            "Screens are monitored during working hours for security and billing accuracy.",
            "Report any suspected data leak to IT immediately.",
          ],
          questions: [
            {
              id: "q-conduct-1",
              prompt: "Where may client data be stored?",
              options: [
                "Any personal cloud drive",
                "Approved company tools only",
                "A personal messenger chat",
                "A USB stick at home",
              ],
              answer: 1,
            },
            {
              id: "q-conduct-2",
              prompt: "You suspect a data leak. What do you do first?",
              options: ["Wait and see", "Tell IT immediately", "Post in the chat room", "Ignore it"],
              answer: 1,
            },
          ],
        },
      ],
    },
    {
      id: "prog-omniwork",
      title: "OmniWork Tools Deep Dive",
      category: "Tools",
      description:
        "Hands-on tour of the Workboard, Omni Chat and KPI so you can run your week without help.",
      audience: "All employees",
      passMark: 70,
      steps: [
        {
          id: "step-board",
          title: "Working the Workboard",
          duration: "12 min",
          summary: "Groups, statuses, assignees and timing on your department board.",
          points: [
            "You only see the board for your own department.",
            "Every task has a status, priority, assignee and a start/due schedule.",
            "The Timing bar shows how much of the scheduled window is left.",
            "Use the task chat to discuss the work — mention colleagues with @.",
          ],
          questions: [
            {
              id: "q-board-1",
              prompt: "What does the Timing bar show?",
              options: [
                "How many people are on the task",
                "How much of the scheduled window is left",
                "The task budget",
                "The number of comments",
              ],
              answer: 1,
            },
          ],
        },
        {
          id: "step-kpi",
          title: "Understanding your KPI score",
          duration: "10 min",
          summary: "The 100-point score and how each category is earned.",
          points: [
            "Your monthly score combines attendance, hours, worklogs and task delivery.",
            "The score is out of 100 and is emailed to you at month end.",
            "Absence rules feed both KPI and payroll deductions.",
            "You can track your live score any time from My KPI.",
          ],
          questions: [
            {
              id: "q-kpi-1",
              prompt: "Which of these does NOT feed your KPI score?",
              options: ["Attendance", "Worklogs", "Task delivery", "Your desk location"],
              answer: 3,
            },
          ],
        },
      ],
    },
  ];
}

function readPrograms(): TrainingProgram[] {
  if (typeof window === "undefined") return defaultPrograms();
  try {
    const raw = window.localStorage.getItem(PROGRAMS_KEY);
    if (!raw) return defaultPrograms();
    const parsed = JSON.parse(raw) as TrainingProgram[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultPrograms();
  } catch {
    return defaultPrograms();
  }
}

function writePrograms(list: TrainingProgram[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRAMS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

function readProgress(): ProgramProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ProgramProgress[]) : [];
  } catch {
    return [];
  }
}

function writeProgress(list: ProgramProgress[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

function useTrainingSync(sync: () => void) {
  useEffect(() => {
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useTrainingPrograms() {
  const [programs, setPrograms] = useState<TrainingProgram[]>(() => defaultPrograms());
  useTrainingSync(() => setPrograms(readPrograms()));

  const save = useCallback((next: TrainingProgram[]) => {
    writePrograms(next);
    setPrograms(next);
  }, []);

  const addProgram = useCallback(
    (p: Omit<TrainingProgram, "id" | "steps">) =>
      save([...readPrograms(), { ...p, id: uid(), steps: [] }]),
    [save],
  );

  const updateProgram = useCallback(
    (id: string, patch: Partial<TrainingProgram>) =>
      save(readPrograms().map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [save],
  );

  const removeProgram = useCallback(
    (id: string) => save(readPrograms().filter((p) => p.id !== id)),
    [save],
  );

  const addStep = useCallback(
    (programId: string, step: Omit<TrainingStep, "id" | "questions">) =>
      save(
        readPrograms().map((p) =>
          p.id === programId
            ? { ...p, steps: [...p.steps, { ...step, id: uid(), questions: [] }] }
            : p,
        ),
      ),
    [save],
  );

  const updateStep = useCallback(
    (programId: string, stepId: string, patch: Partial<TrainingStep>) =>
      save(
        readPrograms().map((p) =>
          p.id === programId
            ? { ...p, steps: p.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }
            : p,
        ),
      ),
    [save],
  );

  const removeStep = useCallback(
    (programId: string, stepId: string) =>
      save(
        readPrograms().map((p) =>
          p.id === programId ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) } : p,
        ),
      ),
    [save],
  );

  const addQuestion = useCallback(
    (programId: string, stepId: string, q: Omit<QuizQuestion, "id">) =>
      save(
        readPrograms().map((p) =>
          p.id === programId
            ? {
                ...p,
                steps: p.steps.map((s) =>
                  s.id === stepId ? { ...s, questions: [...s.questions, { ...q, id: uid() }] } : s,
                ),
              }
            : p,
        ),
      ),
    [save],
  );

  const removeQuestion = useCallback(
    (programId: string, stepId: string, questionId: string) =>
      save(
        readPrograms().map((p) =>
          p.id === programId
            ? {
                ...p,
                steps: p.steps.map((s) =>
                  s.id === stepId
                    ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
                    : s,
                ),
              }
            : p,
        ),
      ),
    [save],
  );

  const reset = useCallback(() => save(defaultPrograms()), [save]);

  return {
    programs,
    addProgram,
    updateProgram,
    removeProgram,
    addStep,
    updateStep,
    removeStep,
    addQuestion,
    removeQuestion,
    reset,
  };
}

export function useTrainingProgress(employeeId?: string) {
  const [all, setAll] = useState<ProgramProgress[]>([]);
  useTrainingSync(() => setAll(readProgress()));

  const mine = employeeId ? all.filter((p) => p.employeeId === employeeId) : all;

  const recordStep = useCallback(
    (
      empId: string,
      programId: string,
      stepId: string,
      answers: Record<string, number>,
      score: number,
      programStepIds: string[],
      passMark: number,
    ) => {
      const list = readProgress();
      const idx = list.findIndex((p) => p.employeeId === empId && p.programId === programId);
      const now = new Date().toISOString();
      const base: ProgramProgress =
        idx >= 0
          ? list[idx]!
          : { employeeId: empId, programId, steps: {}, startedAt: now };
      const steps = {
        ...base.steps,
        [stepId]: {
          answers,
          score,
          ...(score >= passMark ? { completedAt: now } : {}),
        } as StepProgress,
      };
      const done = programStepIds.every((id) => steps[id]?.completedAt);
      const next: ProgramProgress = {
        ...base,
        steps,
        ...(done ? { completedAt: base.completedAt ?? now } : {}),
      };
      const out = idx >= 0 ? list.map((p, i) => (i === idx ? next : p)) : [...list, next];
      writeProgress(out);
      setAll(out);
      return next;
    },
    [],
  );

  const resetProgram = useCallback((empId: string, programId: string) => {
    const out = readProgress().filter(
      (p) => !(p.employeeId === empId && p.programId === programId),
    );
    writeProgress(out);
    setAll(out);
  }, []);

  return { progress: mine, allProgress: all, recordStep, resetProgram };
}

export function programCompletion(program: TrainingProgram, p?: ProgramProgress) {
  const total = program.steps.length || 1;
  const done = program.steps.filter((s) => p?.steps[s.id]?.completedAt).length;
  return Math.round((done / total) * 100);
}

export function scoreQuiz(step: TrainingStep, answers: Record<string, number>) {
  if (!step.questions.length) return 100;
  const correct = step.questions.filter((q) => answers[q.id] === q.answer).length;
  return Math.round((correct / step.questions.length) * 100);
}
