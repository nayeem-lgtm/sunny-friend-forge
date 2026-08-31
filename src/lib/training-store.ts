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
  | {
      type: "founder";
      eyebrow?: string;
      title: string;
      paragraphs: string[];
      name: string;
      role: string;
    }
  | { type: "info"; title: string; body: string; icon?: string; badge?: string }
  | {
      type: "table";
      title?: string;
      intro?: string;
      headers: string[];
      rows: string[][];
    }
  | {
      type: "checklist";
      title?: string;
      intro?: string;
      items: { label: string; description?: string }[];
    }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      objectFit?: "contain" | "cover";
    }
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

const PROGRAMS_KEY = "omniwork.training.programs.v19";
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
          id: "step-founder",
          title: "Our Great Founder & CEO",
          duration: "5 min",
          summary:
            "A personal welcome from Ripon Kumar, Founder and CEO of Ray Advertising & Policy Bear.",
          points: [],
          cards: [
            {
              type: "founder",
              eyebrow: "www.riponkumar.com",
              title: "OUR GREAT FOUNDER & CEO",
              name: "Ripon Kumar",
              role: "Founder And CEO, Ray Advertising & Policy Bear",
              paragraphs: [
                "Hello, and a very warm welcome. I am Ripon Kumar.",
                "At the core of both Ray Advertising and Policy bear lies a shared, entrepreneurial DNA\u2014a drive to architect what's next, not just administer what exists. We operate where the digital landscape constantly shifts, and complacency is the only true failure.",
                "My expectation is simple yet profound: adopt a founder's mindset. Own your role with the vision of a builder. Critically evaluate processes not to criticize, but to improve. Propose solutions that are not just effective, but scalable and forward-thinking. Your intellectual curiosity and initiative are what will transform good ideas into exceptional outcomes.",
                "This is our collective opportunity to do more than adapt; it is to actively shape the trajectory of our industries. Your unique energy and perspective are vital to this mission.",
                "I am excited to embark on this journey with you. Let's combine our strengths, challenge conventions, and build the future of our portfolio - together.",
                "Your story here starts now.",
              ],
            },
            { type: "action", label: "Session finished", icon: "arrow-right" },
          ],
          questions: [],
        },

        {
          id: "step-office-hours",
          title: "Attendance, Office Hours & Sign-In Rules",
          duration: "8 min",
          summary:
            "Office hours, break schedule, the sign-in flow and why accurate attendance matters.",
          points: [],
          cards: [
            {
              type: "prose",
              title: "Daily Schedule",
              paragraphs: [
                "Office Hours: 6:00 AM – 3:00 PM PT (Pacific Time).",
                "Lunch/Dinner Break: 10:00 AM – 11:00 AM PT.",
                "Total Working Hours: 8 hours + 1-hour break.",
              ],
            },
            {
              type: "flow",
              title: "Sign-In & Sign-Out Flow",
              intro:
                "Please make it a habit: complete every step in real time.",
              stages: [
                {
                  label: "Office Sign-In",
                  sublabel: "When you start work",
                  icon: "arrow-right",
                },
                {
                  label: "Break In",
                  sublabel: "When your scheduled break begins",
                  icon: "clock",
                },
                {
                  label: "Break Out",
                  sublabel: "When you return from your break",
                  icon: "clock",
                },
                {
                  label: "Office Sign-Out",
                  sublabel: "When you finish work",
                  icon: "arrow-right",
                },
              ],
            },
            {
              type: "prose",
              title: "Important Attendance Rules",
              paragraphs: [
                "All employees are required to accurately record their attendance through OmniWork.",
                "You must use OmniWork to record Office Sign-In, Break In, Break Out and Office Sign-Out.",
                "Attendance records must be entered in real time. Employees should not sign in or sign out later to correct a missed entry.",
                "Attendance adjustments are not permitted. Therefore, employees are strongly advised to follow the sign-in, break, and sign-out process strictly and accurately every working day.",
                "Accurate OmniWork records are an important part of our attendance management and payroll process. Employees are responsible for ensuring their daily attendance is properly recorded.",
              ],
            },
            {
              type: "info",
              title: "Late attendance affects your KPI",
              body: "Late attendance is reflected negatively in your KPI. 3 late logs will count as 1 day absent.",
              icon: "clock",
              badge: "Reminder",
            },
            { type: "action", label: "Session finished", icon: "arrow-right" },
          ],
          questions: [
            {
              id: "q-office-hours-1",
              prompt: "What is the correct order of attendance actions?",
              options: [
                "Sign In → Break Out → Break In → Sign Out",
                "Sign In → Break In → Break Out → Sign Out",
                "Break In → Sign In → Sign Out → Break Out",
                "Sign Out → Break In → Break Out → Sign In",
              ],
              answer: 1,
              explanation:
                "The correct flow is Sign In, Break In, Break Out, Sign Out.",
            },
            {
              id: "q-office-hours-2",
              prompt: "What happens if you accumulate 3 late attendance logs?",
              options: [
                "It counts as 1 day absent",
                "Nothing",
                "You get a bonus deduction",
                "It is automatically corrected",
              ],
              answer: 0,
              explanation:
                "3 late logs are counted as 1 absent day and affect both KPI and payroll.",
            },
          ],
        },

        {
          id: "step-leave-policy",
          title: "Employee Leave Policy",
          duration: "10 min",
          summary:
            "PTO, probation rules, annual entitlement, carryover and how to request leave.",
          points: [],
          cards: [
            {
              type: "prose",
              title: "Purpose & Scope",
              paragraphs: [
                "This policy establishes the leave entitlements for all employees of RAY Advertising. It is designed to be competitive, straightforward to administer, and compliant with applicable laws across all countries where RAY employees are located.",
                "RAY operates a single unified Paid Time Off (PTO) policy for all employees. There are no separate sick, vacation or personal leave buckets — all paid time off comes from one combined PTO balance.",
              ],
            },
            {
              type: "prose",
              title: "How PTO Works",
              paragraphs: [
                "PTO is a single bank of paid days that employees can use for any reason, including vacation, personal errands, family obligations, illness, medical appointments or mental health days.",
                "Employees do not need to specify or justify the reason for taking PTO. Whether it is a sick day or a holiday trip, it all comes from the same balance, keeping the policy simple and flexible.",
              ],
            },
            {
              type: "prose",
              title: "Eligibility & Probationary Period",
              paragraphs: [
                "All permanent full-time and part-time employees are eligible for PTO, subject to the conditions below.",
                "New employees are subject to a 180-day probationary period from their date of hire. During probation, no PTO may be taken even though days accrue. Accrued days are held and only become available upon successful completion of probation.",
                "Any time off taken during the probationary period will be treated as unpaid leave, subject to manager and HR approval.",
                "After probation, employees are immediately eligible to use their accrued PTO balance.",
              ],
            },
            {
              type: "table",
              title: "PTO Entitlement",
              intro: "Annual PTO grows with tenure at RAY.",
              headers: ["Years of Service", "Annual PTO Days", "Leave Limitation"],
              rows: [
                ["Year 1 (first 12 months)", "12 days", "1 day per month"],
                ["Year 2 – Year 3", "15 days", "Max 2 days per month"],
                ["Year 4 and beyond", "18 days", "Max 2 days per month"],
              ],
            },
            {
              type: "info",
              title: "Carryover",
              body: "There is no carryover. All unused PTO expires at the end of the calendar year. Employees are encouraged to plan and use their PTO balance before December 31st.",
              icon: "calendar",
              badge: "Use it or lose it",
            },
            {
              type: "prose",
              title: "Requesting PTO or Unpaid Leave",
              paragraphs: [
                "Submit a leave request via the ERP at least 24 hours in advance for planned leave.",
                "Manager approval is required and subject to business needs and team coverage. PTO requests during high-volume periods (e.g., campaign launches, Q4) may be limited at manager discretion.",
                "Until your leave is approved or denied, do not intentionally take the day off — doing so may result in a penalty of 2 days.",
                "Attach supporting documents and a proper explanation in the leave application.",
                "Select handover colleagues if applicable so work continues smoothly while you are away.",
              ],
            },
            { type: "action", label: "Session finished", icon: "arrow-right" },
          ],
          questions: [],
        },

        {
          id: "step-discipline-conduct",
          title: "Discipline and Code of Conduct",
          duration: "12 min",
          summary:
            "The standards of behaviour, professionalism and remote-work discipline expected from every RAY team member.",
          points: [],
          cards: [
            {
              type: "prose",
              title: "Why discipline matters",
              paragraphs: [
                "A high-performance culture is built on trust, accountability and consistent behaviour. This step outlines the general code of conduct that applies to everyone, plus the additional expectations for remote staff.",
                "Read each standard carefully. These rules protect our team, our clients and the company assets we all rely on.",
              ],
            },
            {
              type: "info",
              title: "Be hyper active",
              body: "Stay engaged, responsive and proactive throughout the workday. Hyper activity means taking initiative, replying promptly and keeping momentum on every task.",
              icon: "zap",
              badge: "Mindset",
            },
            {
              type: "checklist",
              title: "10.1 Code of Conduct — General",
              intro: "These standards apply to every employee, in every location and role.",
              items: [
                {
                  label: "Avoid non-work activities during working hours",
                  description:
                    "Limit personal errands, social media or entertainment so team productivity stays high.",
                },
                {
                  label: "Communicate through official channels",
                  description:
                    "Use company-approved tools such as email, Omni Chat and project systems. Personal emails and unofficial channels are prohibited.",
                },
                {
                  label: "Provide regular updates",
                  description:
                    "Share progress on tasks, ask questions early and raise issues promptly.",
                },
                {
                  label: "Always join meetings with camera on",
                  description: "No exceptions. Video presence builds trust and keeps meetings focused.",
                },
                {
                  label: "Maintain professionalism and integrity",
                  description:
                    "Treat colleagues, clients and stakeholders with respect. Be honest and avoid conflicts of interest.",
                },
                {
                  label: "Protect company assets",
                  description:
                    "Safeguard physical assets (equipment, laptops, vehicles, office supplies) and digital assets (data, software, systems, intellectual property).",
                },
                {
                  label: "Follow reporting structures",
                  description:
                    "Report to assigned supervisors, escalate through the proper hierarchy and avoid bypassing authority without a valid reason.",
                },
                {
                  label: "Achieve assigned KPIs",
                  description:
                    "Understand your goals, work efficiently to meet targets and monitor progress to keep improving.",
                },
                {
                  label: "Maintain confidentiality",
                  description:
                    "Keep business strategies, financial data, client information and internal communications secure.",
                },
              ],
            },
            {
              type: "checklist",
              title: "10.2 Code of Conduct — Remote Staff",
              intro: "Additional expectations for team members working outside the office.",
              items: [
                {
                  label: "Maintain regular working hours and availability",
                  description:
                    "Be online and reachable during scheduled hours. Inform managers in advance about any absence or schedule change.",
                },
                {
                  label: "Attend meetings professionally",
                  description:
                    "Join on time, be prepared, dress appropriately when video is required and use a quiet, well-lit space.",
                },
                {
                  label: "Ensure a distraction-free work environment",
                  description:
                    "Minimize background noise and interruptions. Avoid multitasking with non-work activities and set boundaries with household members.",
                },
                {
                  label: "Maintain proper power backup",
                  description:
                    "Keep your devices charged and have a reliable power backup (UPS or charged battery) so work is not interrupted by outages.",
                },
                {
                  label: "Maintain proper internet connection and backup",
                  description:
                    "Use a stable, high-speed connection. Always keep a backup internet option ready, such as mobile data or a secondary network.",
                },
                {
                  label: "Use proper lighting during meetings",
                  description:
                    "Make sure your face is clearly visible. Sit facing a light source or in a well-lit room so colleagues can see and connect with you.",
                },
                {
                  label: "Wear proper attire during meetings",
                  description:
                    "Dress professionally for all video calls just as you would in the office. Your appearance reflects the RAY standard.",
                },
                {
                  label: "Protect company data and systems",
                  description:
                    "Use secure internet connections, follow IT security policies (VPNs, strong passwords, device locks) and avoid accessing company systems on shared or public devices.",
                },
              ],
            },
            { type: "action", label: "Session finished", icon: "arrow-right" },
          ],
          questions: [],
        },

        {
          id: "step-job-grade",
          title: "Know Your Job Grade",
          duration: "8 min",
          summary:
            "The RAY grading framework — from General Support Staff up to the Executive band — and where every role sits.",
          points: [],
          cards: [
            {
              type: "prose",
              title: "Why grades exist",
              paragraphs: [
                "Every role at RAY is mapped to a grade (L9 – L22) and a band. Your grade defines your level of responsibility, decision-making authority, reporting line and career path.",
                "Grades keep promotions, compensation and expectations transparent. When you know your grade, you know exactly what the next step looks like.",
              ],
            },
            {
              type: "table",
              title: "RAY Grade Structure",
              intro: "Find your level title and the roles that sit inside it.",
              headers: ["Grade", "Band", "Level Title", "Positions / Roles"],
              rows: [
                ["L22", "Executive", "Chief Executive Officer", "Chief Executive Officer (CEO)"],
                ["L21", "Executive", "Managing Director / President", "Managing Director (MD), President"],
                ["L20", "Executive", "C-Suite Officers", "CHRO, COO, CFO, CTO, CMO"],
                [
                  "L19",
                  "Senior Mgmt",
                  "Director / VP",
                  "Director of E-Commerce, Director of Affiliates, VP/SVP HR",
                ],
                [
                  "L18",
                  "Senior Mgmt",
                  "Senior Manager / AVP",
                  "Branch & Operations Manager, Assistant Director, Senior Affiliate Manager, QA/QC Head, Sr. Manager/AVP HR",
                ],
                [
                  "L17",
                  "Senior Mgmt",
                  "Manager / Head of Function",
                  "Head of Media Buying, Project Manager, Business Development Manager, Manager HR, Senior Affiliate Manager",
                ],
                [
                  "L16",
                  "Middle Mgmt",
                  "Technical Lead",
                  "Full Stack Developer, Back-End Developer, AI Engineer, Senior Accountant, Deputy Manager HR",
                ],
                [
                  "L15",
                  "Middle Mgmt",
                  "Senior Creative & Ops Manager",
                  "E-com Operations Supervisor, Team Lead (E-Commerce), Assistant Manager HR",
                ],
                [
                  "L14",
                  "Specialist",
                  "Mid-Level Specialist",
                  "Front-End Developer, API Developer, UI/UX Designer, SEO Expert, Digital Marketing Specialist, Brand Visibility Specialist, Affiliate Manager, Advertiser Account Manager, Media Buyer, Senior Executive HR",
                ],
                [
                  "L13",
                  "Specialist",
                  "Associate Specialist",
                  "Accountant, Content Writer, Graphic Designer, Video Editor, Sales Executive, Executive HR",
                ],
                [
                  "L12",
                  "Junior Prof.",
                  "Junior Professional",
                  "Junior Graphic Designer, Junior Associate, Affiliate Coordinator, Virtual / Administrative Assistant, QC Agent, Junior Executive HR",
                ],
                ["L11", "Junior Prof.", "Entry / Trainee", "Receptionist, Intern (Fixed Term)"],
                ["L10", "Skilled Support", "Skilled Support Staff", "Store Keeper, Driver"],
                ["L9", "General Staff", "General Support Staff", "Office Assistant, Guard, Peon, Aya, MLSS"],
              ],
            },
            {
              type: "checklist",
              title: "How to use your grade",
              intro: "Three things every team member should know about their level.",
              items: [
                {
                  label: "Know your band",
                  description:
                    "Executive, Senior Management, Middle Management, Specialist, Junior Professional, Skilled Support or General Staff — your band sets the scope of your decisions.",
                },
                {
                  label: "Know your reporting line",
                  description:
                    "You escalate to the grade above yours. Skipping levels without a valid reason breaks the reporting structure.",
                },
                {
                  label: "Know your next step",
                  description:
                    "Promotion moves you to the next grade once you consistently deliver the KPIs and responsibilities of that level.",
                },
              ],
            },
            {
              type: "info",
              title: "Not sure of your grade?",
              body: "Your grade is listed on your appointment letter and in your OmniWork profile. If it is missing or looks incorrect, contact HR.",
              icon: "users",
              badge: "HR",
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
        {
          id: "step-ray-advertising-achievement",
          title: "Ray Advertising — A Champion's Place",
          duration: "8 min",
          summary:
            "You're joining a two-time Best Pay-Per-Call Network winner. Learn what makes us champions and how you become one.",
          points: [],
          cards: [
            {
              type: "hero",
              title: "You're in a Place of Champions",
              body: "Ray Advertising has been selected as the Best Pay-Per-Call Network by OfferVault two years in a row — 2025 and 2026. We want you to be a champion like us.",
              icon: "award",
            },
            {
              type: "image",
              src: "/__l5e/assets-v1/8be01cef-b24d-4a23-a646-41ab650b3279/offervault-winner-badge.png",
              alt: "Ray Advertising OfferVault Best Pay-Per-Call Network Winner Badge 2025 & 2026",
              caption: "Best Pay-Per-Call Network — 2025 & 2026",
            },
            {
              type: "prose",
              title: "Our Achievement",
              paragraphs: [
                "TWO YEARS. TWO RECOGNITIONS. ONE STANDARD.",
                "🏆 Best Pay-Per-Call Network — 2025",
                "🏆 Best Pay-Per-Call Network — 2026",
                "Being recognized once is an achievement. Being recognized two years in a row is a standard. We don't want to simply maintain that standard — we want to raise it. And that's where you come in.",
              ],
            },
            {
              type: "checklist",
              title: "Our Mindset",
              intro: "WE BELIEVE CHAMPIONS ARE BUILT, NOT BORN. At Ray Advertising, success comes from:",
              items: [
                { label: "Ownership", description: "Take responsibility for your work." },
                { label: "Discipline", description: "Do the right things consistently." },
                { label: "Performance", description: "Focus on measurable results." },
                { label: "Integrity", description: "Do business the right way, even when nobody is watching." },
                { label: "Growth", description: "Learn, improve, and become better every day." },
              ],
            },
            {
              type: "info",
              title: "We don't expect you to be perfect. We expect you to improve.",
              body: "You are joining a company that has already proven what it can achieve. But our biggest achievements are not behind us — they're ahead of us. Our goal is not to have a few champions on the team; our goal is to build a team full of champions.",
              icon: "trending-up",
              badge: "Winning Team",
            },
            {
              type: "image",
              src: "/__l5e/assets-v1/8be01cef-b24d-4a23-a646-41ab650b3279/offervault-winner-badge.png",
              alt: "Ray Advertising OfferVault Best Pay-Per-Call Network Winner Badge 2025 & 2026",
              caption: "Two-time winner — a standard worth raising",
            },
            {
              type: "prose",
              title: "Your Journey Starts Here",
              paragraphs: [
                "RAY ADVERTISING — YOU'RE PART OF THE TEAM NOW.",
                "We have the recognition. We have the experience. We have the ambition. Now we need you.",
                "Learn the business. Master your role. Take ownership. Help your team. Deliver results. Keep raising the standard.",
                "We became champions together. Now, it's your turn to become one.",
                "WELCOME TO RAY ADVERTISING. Let's build what's next.",
              ],
            },
            { type: "action", label: "I am ready to become a champion", icon: "award" },
          ],
          questions: [],
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
