
> **Status:** Product & Technical Source of Truth  
> **Product:** وثّقلي  
> **English brand:** Wathqly  
> **Type:** Personal Operating System → Founder OS → Team OS  
> **Primary user:** Youssef Emad  
> **Architecture:** Modular Monolith  
> **Frontend:** Next.js + TypeScript  
> **UI:** Tailwind CSS + shadcn/ui  
> **Backend / Data:** Supabase + PostgreSQL + pgvector  all in supabase
> **Whiteboard:** Custom-built engine  
> **Theme:** Light + Dark

---

## 1. Product Vision

وثّقلي is a private, secure, AI-native operating system for managing personal life, work, projects, goals, knowledge, business relationships, content, planning, and execution from one connected workspace.

It is **not** a Notion clone, task manager, CRM, or AI chatbot.

The core product loop is:

```text
Capture → Organize → Plan → Execute → Track → Reflect → Improve
```

Every major object should be connectable to other objects.

Example:

```text
Goal
  ↓
Plan
  ↓
Project
  ↓
Tasks
  ↓
Calendar
  ↓
Execution
  ↓
Metrics
  ↓
AI Review
  ↓
Next Plan
```

The system must be useful for one person today and structurally ready for teams tomorrow.

---

# 2. Product Principles

1. **Everything is connected.**
2. **The system should turn information into action.**
3. **AI is a system layer, not a sidebar chatbot.**
4. **Privacy is a product feature.**
5. **The user owns their data.**
6. **Fast interactions matter more than visual complexity.**
7. **No unnecessary UI decoration.**
8. **Every feature must have a clear reason to exist.**
9. **Personal-first, team-ready architecture.**
10. **The interface must feel calm, premium, focused, and professional.**

---

# 3. Primary Modules

The application consists of these core modules:

- Home / Command Center
- Goals
- Planning
- Tasks
- Projects
- Calendar
- Knowledge
- Notes
- Documents / Files
- Bookmarks
- CRM
- Contacts
- Companies
- Deals
- Meetings
- Content
- Whiteboard
- Mind Maps
- AI
- Memory
- Search
- Automations
- Notifications
- Analytics
- Settings
- Workspace / Team

---

# 4. Information Architecture

```text
وثّقلي
│
├── Home
│
├── Plan
│   ├── Today
│   ├── Week
│   ├── Month
│   ├── Calendar
│   └── Reviews
│
├── Goals
│   ├── Vision
│   ├── Year
│   ├── Quarter
│   ├── Month
│   └── Goal Reviews
│
├── Work
│   ├── Projects
│   ├── Tasks
│   └── Roadmaps
│
├── Knowledge
│   ├── Notes
│   ├── Wiki
│   ├── Research
│   ├── Documents
│   └── Bookmarks
│
├── Business
│   ├── CRM
│   ├── Companies
│   ├── Contacts
│   ├── Leads
│   ├── Deals
│   └── Meetings
│
├── Content
│   ├── Ideas
│   ├── Drafts
│   ├── Calendar
│   ├── Published
│   └── Analytics
│
├── Creative
│   ├── Whiteboards
│   └── Mind Maps
│
├── AI
│   ├── Assistant
│   ├── Memory
│   └── AI Activity
│
└── Settings
    ├── Profile
    ├── Workspace
    ├── Members
    ├── Permissions
    ├── Integrations
    ├── Security
    └── Billing
```

---

# 5. Home / Command Center

The Home page is the primary daily workspace.

It should answer:

- What do I need to do today?
- What is most important?
- What is overdue?
- What is coming next?
- How am I progressing toward my goals?
- What needs attention?
- What did I recently work on?
- What does the AI recommend?

### Core widgets

- Greeting
- Today's priorities
- Tasks
- Overdue tasks
- Today's calendar
- Weekly progress
- Active projects
- Goal progress
- CRM follow-ups
- Content due
- Recent notes
- Recent activity
- AI recommendations
- Quick capture

The dashboard should be customizable later.

---

# 6. Goals System

Goals are hierarchical.

```text
Vision
  ↓
Year
  ↓
Quarter
  ↓
Month
  ↓
Week
  ↓
Day
```

A goal can contain:

- title
- description
- status
- priority
- target
- current value
- unit
- deadline
- progress
- parent goal
- child goals
- projects
- tasks
- notes
- reviews

Example:

```text
2026
└── Q4
    └── CertiLayer Growth
        ├── 20 Customers
        ├── Revenue Target
        └── Product Growth
```

Goal progress should be calculated from measurable values where possible.

---

# 7. Planning System

Planning connects goals to execution.

Supported planning levels:

- Year
- Quarter
- Month
- Week
- Day

### Weekly planning

The user can ask:

> Plan my week.

The AI analyzes:

- active goals
- active projects
- incomplete tasks
- deadlines
- calendar
- CRM follow-ups
- content schedule
- available time

Then generates a proposed weekly plan.

The user must be able to edit, approve, reject, or regenerate the plan.

### Daily planning

The user can ask:

> Plan my day.

The system should prioritize work based on:

- goal relevance
- urgency
- deadlines
- dependencies
- estimated effort
- calendar availability
- overdue status

---

# 8. Tasks

Tasks are first-class entities.

### Task fields

- title
- description
- status
- priority
- due date
- start date
- estimated duration
- actual duration
- project
- goal
- assignee
- labels
- tags
- parent task
- subtasks
- dependencies
- attachments
- comments
- activity

### Task views

- My Day
- List
- Board / Kanban
- Calendar
- Timeline
- Completed
- Overdue

### Recurring tasks

Support:

- daily
- weekly
- monthly
- custom recurrence

Example:

```text
Every Sunday → Weekly Review
```

---

# 9. Projects

Each project has its own connected workspace.

Example:

```text
CertiLayer
├── Overview
├── Goals
├── Roadmap
├── Tasks
├── Notes
├── Files
├── CRM
├── Content
├── Metrics
├── Whiteboards
└── Activity
```

Project overview should show:

- project status
- progress
- deadlines
- active goals
- task completion
- recent activity
- team members
- AI summary

---

# 10. Calendar

Calendar connects:

- tasks
- meetings
- events
- content
- CRM follow-ups
- plans

Views:

- Day
- Week
- Month
- Agenda

Future integrations:

- Google Calendar
- Apple Calendar
- Outlook Calendar

External calendars must not become the source of truth for internal tasks.

---

# 11. Notes and Knowledge

The knowledge system is inspired by the flexibility of Notion and Obsidian without copying either product.

### Editor

Use Tiptap / ProseMirror.

Support:

- headings
- paragraphs
- lists
- checklists
- tables
- code blocks
- quotes
- callouts
- links
- mentions
- embeds
- slash commands
- backlinks

Notes should support relationships with:

- projects
- goals
- tasks
- people
- companies
- content
- meetings
- whiteboards
- bookmarks

---

# 12. Documents and Files

Use Supabase Storage.

Supported file categories:

- PDF
- images
- video
- audio
- CSV
- documents
- archives where appropriate

Files can be attached to:

- projects
- notes
- tasks
- CRM records
- meetings
- whiteboards

Use signed URLs and access policies.

---

# 13. Bookmarks

A bookmark can represent:

- website
- article
- GitHub repository
- YouTube video
- research paper
- tool
- reference

Fields:

- URL
- title
- description
- domain
- tags
- folder
- project
- notes
- AI summary

AI action:

> Summarize this bookmark and add it to CertiLayer research.

---

# 14. CRM

CRM is a first-class business module.

```text
CRM
├── Companies
├── Contacts
├── Leads
├── Deals
├── Customers
├── Pipelines
├── Activities
├── Meetings
└── Follow-ups
```

### Deal pipeline

```text
Lead
 ↓
Contacted
 ↓
Qualified
 ↓
Demo
 ↓
Evaluation
 ↓
Proposal
 ↓
Won / Lost
```

A CRM record should connect to:

- tasks
- meetings
- notes
- projects
- content
- companies
- contacts
- deals

---

# 15. Meetings

Meeting entity:

- title
- date
- participants
- company
- project
- notes
- decisions
- action items
- follow-ups
- attachments

AI workflow:

```text
Transcript / Notes
        ↓
Summary
        ↓
Decisions
        ↓
Action Items
        ↓
Tasks
        ↓
Follow-ups
```

No action should be performed automatically when it can cause an external side effect without user approval.

---

# 16. Content Management

Content should have a lifecycle:

```text
Idea
 ↓
Draft
 ↓
Review
 ↓
Scheduled
 ↓
Published
 ↓
Analytics
```

Platforms may include:

- LinkedIn
- X
- YouTube
- TikTok
- Instagram
- Blog

Content calendar should connect content to:

- projects
- campaigns
- goals
- platforms
- ideas
- analytics

AI actions:

- generate draft
- improve draft
- repurpose content
- create variants
- generate weekly content plan
- summarize performance

Publishing integrations can be added later.

---

# 17. Whiteboard

The whiteboard is custom-built and is a major product surface.

Do not make the product dependent on Excalidraw.

### Whiteboard core

- infinite canvas
- pan
- zoom
- selection
- multi-selection
- drag
- resize
- rotate
- grouping
- copy / paste
- duplicate
- delete
- undo / redo
- keyboard shortcuts
- snapping
- alignment
- layers
- frames

### Elements

- text
- rectangle
- circle
- line
- arrow
- connector
- sticky note
- image
- frame
- group

### Advanced

- comments
- mentions
- templates
- version history
- collaborative editing
- realtime cursors
- permissions

The whiteboard data model must be designed for future realtime collaboration even if V1 is single-user.

---

# 18. Mind Maps

Mind maps use the same underlying canvas engine.

Nodes should support:

- title
- description
- color
- icon
- links
- relationships
- child nodes

AI action:

> Create a mind map from this note.

AI should generate structured nodes, not an image.

Mind map nodes can optionally become:

- tasks
- projects
- goals
- notes

---

# 19. AI Core

AI is a platform layer.

```text
AI
├── Assistant
├── Memory
├── Retrieval
├── Tools
├── Agents
└── Activity
```

### AI capabilities

- natural language search
- summarization
- planning
- task creation
- task organization
- goal analysis
- project analysis
- meeting processing
- CRM assistance
- content creation
- note creation
- whiteboard generation
- weekly review
- daily planning

Example:

> What should I do today?

The AI should inspect real system state before answering.

---

# 20. AI Tool Layer

Tools should be explicit and permission-aware.

Example tools:

```text
create_task()
update_task()
complete_task()
create_goal()
update_goal()
create_project()
create_note()
search_notes()
search_projects()
search_tasks()
search_crm()
create_meeting()
create_plan()
create_content()
create_whiteboard()
create_mindmap()
```

AI must not receive unrestricted database access.

Use an application-level tool layer.

Sensitive actions require confirmation.

---

# 21. AI Memory

Memory categories:

```text
User Memory
Project Memory
Business Memory
Knowledge Memory
Decision Memory
Conversation Memory
```

Memory should store useful context, not every piece of raw conversation.

Memory must have:

- source
- confidence
- timestamp
- scope
- privacy level
- ability to inspect
- ability to delete

The user must be able to see and manage AI memories.

---

# 22. Search

Use hybrid search.

```text
Keyword Search
+
PostgreSQL Full Text Search
+
Vector Search
+
Entity Search
+
Filters
```

Search should cover:

- notes
- projects
- tasks
- goals
- CRM
- meetings
- content
- files
- bookmarks
- whiteboards

Global shortcut:

```text
Cmd / Ctrl + K
```

---

# 23. Knowledge Graph

Important entities should be related.

```text
Goal
 ↕
Project
 ↕
Task
 ↕
Note
 ↕
Person
 ↕
Company
 ↕
Content
 ↕
Whiteboard
```

The graph should support backlinks and related-content views.

Do not build a visually complex graph visualization unless it provides real utility.

---

# 24. Automations

Automation engine:

```text
Trigger
 ↓
Conditions
 ↓
Actions
```

Example:

```text
WHEN task becomes overdue
IF priority = high
THEN notify user
```

Another:

```text
WHEN deal becomes Won
THEN create onboarding project
```

Scheduled:

```text
Every Sunday
→ Weekly Review
→ Generate proposed next-week plan
```

Automation execution must be logged.

---

# 25. Notifications

Notification types:

- task due
- overdue task
- mention
- CRM follow-up
- goal milestone
- automation
- AI recommendation
- system/security

Future channels:

- in-app
- email
- push
- Telegram
- WhatsApp where supported

---

# 26. Analytics

### Personal analytics

- task completion
- goal progress
- project velocity
- planned vs completed
- overdue work
- focus time
- weekly output

### Business analytics

- leads
- conversion
- pipeline
- revenue
- deals
- content performance

Analytics must prioritize actionable information over vanity metrics.

---

# 27. Workspace / Team Architecture

Even when only Youssef uses the system, all data should be workspace-scoped.

```text
User
 ↓
Workspace
 ↓
Members
 ↓
Resources
```

Future:

```text
CertiLayer Workspace
├── Youssef — Owner
├── Marketing — Member
├── Engineering — Member
└── Sales — Member
```

Roles:

- Owner
- Admin
- Member
- Viewer

The architecture must support project-level permissions later.

---

# 28. Security

Security requirements:

- Supabase Auth
- email authentication
- OAuth where useful
- MFA
- future Passkeys
- PostgreSQL Row Level Security
- workspace-scoped authorization
- secure cookies
- server-side authorization
- rate limiting
- audit logs
- session management
- signed file URLs
- secure file policies
- encrypted secrets
- database backups
- data export
- account deletion

AI permissions must be separate from user permissions.

---

# 29. Design System

The product should feel:

- premium
- calm
- minimal
- professional
- modern
- focused
- fast

Do not copy the visual identity of Notion, Linear, Obsidian, Apple, or other products.

Use shadcn/ui as the component foundation and build a custom visual identity around it.

---

# 30. Color System

The user wants the **CertiLayer purple family** to be reused as the primary accent, but the entire palette must be designed systematically.

Do NOT use purple everywhere.

Purple is an accent / brand color, not the default background.

### Brand accent

Primary:

```text
#7C3AED
```

Supporting accent:

```text
#8B5CF6
#6D28D9
#5B21B6
```

Use these mainly for:

- primary actions
- selected navigation
- focus states
- links
- progress
- AI highlights
- important interactive elements

### Light theme

Background:

```text
#FFFFFF
#FAFAFA
#F7F7F8
```

Foreground:

```text
#18181B
#27272A
#3F3F46
```

Borders:

```text
#E4E4E7
#D4D4D8
```

Muted:

```text
#71717A
#A1A1AA
```

Primary:

```text
#7C3AED
```

Primary foreground:

```text
#FFFFFF
```

### Dark theme

Background:

```text
#09090B
#0F0F12
#18181B
```

Foreground:

```text
#FAFAFA
#F4F4F5
#D4D4D8
```

Borders:

```text
#27272A
#3F3F46
```

Muted:

```text
#A1A1AA
#71717A
```

Primary:

```text
#8B5CF6
```

Primary hover:

```text
#A78BFA
```

Primary foreground:

```text
#FFFFFF
```

### Semantic colors

Success:

```text
#22C55E
```

Warning:

```text
#F59E0B
```

Danger:

```text
#EF4444
```

Info:

```text
#3B82F6
```

These colors should be used sparingly and consistently.

### Important color rule

Avoid:

- purple gradients everywhere
- glowing purple backgrounds
- excessive glassmorphism
- neon UI
- saturated cards
- giant gradients

The interface should remain readable and professional.

---

# 31. Typography

Primary UI font:

```text
Inter
```

Alternative if needed:

```text
Geist
```

Code / technical content:

```text
JetBrains Mono
```

Arabic support must be first-class.

Choose an Arabic font that pairs cleanly with the Latin UI font.

Typography should prioritize readability over decorative styling.

---

# 32. Theme

Support:

- Light
- Dark
- System

Persist the user's theme preference.

Theme switching must not cause layout shifts.

Use semantic CSS variables rather than hard-coded colors throughout components.

---

# 33. UI Conventions

Buttons:

- clear hierarchy
- primary / secondary / ghost / destructive

Cards:

- minimal borders
- subtle radius
- avoid excessive shadows

Dialogs:

- concise
- focused
- keyboard accessible

Command palette:

```text
Cmd/Ctrl + K
```

Quick capture:

```text
Cmd/Ctrl + Shift + Space
```

Navigation must be keyboard-friendly.

---

# 34. Responsive Design

Desktop is the primary experience because the product is a workspace.

Still support:

- laptop
- tablet
- mobile

Mobile should prioritize:

- Today
- Tasks
- Notes
- Calendar
- CRM
- AI
- Quick capture

Whiteboard should have a touch-friendly mode.

---

# 35. Accessibility

Requirements:

- keyboard navigation
- visible focus states
- semantic HTML
- ARIA where necessary
- sufficient contrast
- reduced motion support
- screen-reader compatibility
- no interaction that depends only on color

Target WCAG AA where practical.

---

# 36. Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide
- Framer Motion

## Editor

- Tiptap
- ProseMirror

## Backend / Data

- Supabase
- PostgreSQL
- pgvector
- Supabase Auth
- Supabase Storage
- Supabase Realtime

## Validation

- Zod

## Forms

- React Hook Form

## Data / Client State

- TanStack Query
- local state only where appropriate

## AI

- Vercel AI SDK or equivalent
- LLM provider abstraction
- tool calling
- embeddings
- RAG
- pgvector

Do not tightly couple the entire application to one LLM provider.

## Search

- PostgreSQL FTS
- pgvector
- metadata filters

## Testing

- Vitest
- Playwright

## Observability

- Sentry
- structured application logs

## Product Analytics

- PostHog

## CI/CD

- GitHub Actions

## Package Manager

- pnpm

---

# 37. Architecture

Use a **Modular Monolith**.

Do not start with microservices.

Suggested boundaries:

```text
Auth
Workspace
Goals
Planning
Tasks
Projects
Knowledge
CRM
Content
Calendar
Whiteboard
AI
Search
Automation
Notifications
Analytics
```

Each domain should own:

- types
- schemas
- database access
- server actions
- UI
- tests

Cross-domain operations should go through explicit application services.

---

# 38. Suggested Repository Structure

```text
wathqly/
│
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── home/
│   │   ├── goals/
│   │   ├── plan/
│   │   ├── tasks/
│   │   ├── projects/
│   │   ├── calendar/
│   │   ├── knowledge/
│   │   ├── notes/
│   │   ├── crm/
│   │   ├── content/
│   │   ├── meetings/
│   │   ├── whiteboards/
│   │   ├── ai/
│   │   └── settings/
│   └── api/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── features/
│   ├── goals/
│   ├── planning/
│   ├── tasks/
│   ├── projects/
│   ├── knowledge/
│   ├── crm/
│   ├── content/
│   ├── calendar/
│   ├── meetings/
│   ├── whiteboard/
│   ├── ai/
│   ├── search/
│   └── automation/
│
├── lib/
│   ├── supabase/
│   ├── ai/
│   ├── search/
│   ├── permissions/
│   ├── automation/
│   └── utils/
│
├── actions/
├── hooks/
├── schemas/
├── types/
├── tests/
└── supabase/
    ├── migrations/
    ├── functions/
    └── seed/
```

---

# 39. Core Database Entities

Initial core entities:

```text
users
workspaces
workspace_members
roles

projects
project_members

goals
goal_relationships

plans
plan_items

tasks
task_dependencies
task_comments
task_labels

notes
note_blocks
note_links

folders
tags

companies
contacts
leads
pipelines
deals
activities

meetings
meeting_participants

calendar_events

content
content_platforms
content_campaigns

files
bookmarks

whiteboards
whiteboard_elements
whiteboard_connections

ai_conversations
ai_messages
ai_memories
embeddings

automations
automation_runs

notifications
audit_logs
```

Database schema must be designed before building dependent UI.

Use UUIDs.

Use timestamps consistently.

Every workspace-owned resource should have `workspace_id`.

---

# 40. Database Security

Every workspace-owned table must be protected by RLS.

Conceptually:

```text
Authenticated User
        ↓
Workspace Membership
        ↓
Allowed Resource
```

Never trust a client-provided workspace ID without server-side authorization.

Use server-side Supabase clients for privileged operations.

Never expose service-role credentials to the browser.

---

# 41. Whiteboard Data Model

Whiteboard should be JSON-friendly but normalized enough for collaboration.

Example:

```text
whiteboards
- id
- workspace_id
- project_id
- title
- created_by
- created_at
- updated_at

whiteboard_elements
- id
- whiteboard_id
- type
- x
- y
- width
- height
- rotation
- z_index
- data
- created_by
- updated_at

whiteboard_connections
- id
- whiteboard_id
- source_element_id
- target_element_id
- data
```

The element `data` field may contain type-specific properties.

Design for future realtime synchronization.

---

# 42. AI Retrieval Architecture

```text
User Query
    ↓
Intent Detection
    ↓
Search / Retrieval
    ├── PostgreSQL FTS
    ├── Vector Search
    └── Relationship Retrieval
    ↓
Context Assembly
    ↓
LLM
    ↓
Answer / Tool Call
```

Do not send the entire database to the model.

Retrieve only relevant context.

---

# 43. AI Safety and Permissions

AI should have scopes.

Example:

```text
READ_NOTES
READ_PROJECTS
READ_TASKS
READ_CRM
CREATE_TASK
UPDATE_TASK
CREATE_NOTE
CREATE_PROJECT
CREATE_PLAN
```

High-impact actions require confirmation.

Examples:

- sending external messages
- publishing content
- deleting records
- changing important CRM information
- changing permissions
- destructive operations

AI activity should be logged.

---

# 44. Performance Requirements

The application should feel instant for normal operations.

Targets:

- fast initial navigation
- optimistic UI for lightweight mutations
- debounced autosave
- pagination / virtualization for large lists
- lazy-load heavy modules
- lazy-load whiteboard engine
- avoid unnecessary client components
- server components by default where appropriate

Do not turn the entire dashboard into a client component.

---

# 45. Offline / Resilience

Where practical:

- local draft preservation
- note autosave recovery
- whiteboard local state recovery
- optimistic updates
- retry failed requests

Future:

- offline-first notes
- offline-first whiteboard
- sync engine

---

# 46. Auditing

Audit important actions:

```text
actor
workspace
action
entity_type
entity_id
timestamp
metadata
```

Examples:

- task deleted
- goal changed
- CRM stage changed
- permission changed
- AI action executed
- file deleted

---

# 47. Development Rules

1. TypeScript strict mode.
2. No `any` unless explicitly justified.
3. Validate external input with Zod.
4. Never trust client authorization.
5. Use RLS for workspace isolation.
6. Keep domain logic outside UI components.
7. Prefer server components by default.
8. Use client components only when interaction requires them.
9. Keep reusable UI in shadcn-based components.
10. Avoid duplicated business logic.
11. Write tests for critical domain logic.
12. Every database migration must be versioned.
13. Never commit secrets.
14. Use environment variables for credentials.
15. Keep AI providers behind an abstraction.
16. Avoid premature microservices.
17. Keep whiteboard code isolated from the rest of the UI.
18. Every major feature needs loading, empty, error, and success states.
19. Keyboard accessibility is required.
20. Destructive actions require confirmation.

---

# 48. Product Quality Bar

A feature is not considered complete until it has:

- desktop UI
- responsive behavior
- dark mode
- light mode
- loading state
- empty state
- error state
- success feedback
- keyboard accessibility
- permission handling
- database validation
- RLS where applicable
- tests for important logic
- AI integration where appropriate
- audit logging where appropriate

---

# 49. Roadmap

## Phase 0 — Foundation

- repository
- Next.js setup
- TypeScript
- Tailwind
- shadcn
- theme system
- Supabase
- auth
- database
- RLS
- workspace
- app shell
- navigation

## Phase 1 — Core OS

- Home
- Goals
- Plans
- Tasks
- Projects
- Calendar

## Phase 2 — Knowledge

- Notes
- Tiptap editor
- folders
- tags
- backlinks
- search
- files
- bookmarks

## Phase 3 — Business

- CRM
- contacts
- companies
- leads
- deals
- meetings
- content calendar

## Phase 4 — Creative

- custom whiteboard
- mind maps
- connectors
- templates
- realtime architecture

## Phase 5 — AI

- AI assistant
- retrieval
- memory
- tool calling
- daily planning
- weekly planning
- AI reviews
- AI actions

## Phase 6 — Automation

- triggers
- conditions
- actions
- scheduled workflows
- notifications
- automation history

## Phase 7 — Team OS

- members
- roles
- permissions
- teams
- shared projects
- collaboration
- approvals

---

# 50. What NOT to Build

Avoid building these without a clear product reason:

- unnecessary social feed
- generic chat platform
- excessive gamification
- vanity dashboards
- dozens of themes
- complicated graph visualization
- microservices from day one
- custom authentication when Supabase Auth is sufficient
- AI features that merely rephrase text
- features copied from competitors without a reason

---

# 51. Product Identity

The product name is:

# وثّقلي

English transliteration:

# Wathqly

The brand should communicate:

- personal ownership
- documentation
- organization
- memory
- execution
- trust
- clarity

Possible product positioning:

> **وثّقلي — Your life, organized.**

or:

> **وثّقلي — Your personal operating system.**

The final tagline is not locked.

---

# 52. Definition of Done

The system is considered production-ready only when:

- authentication is secure
- workspace isolation works
- RLS is verified
- data backup strategy exists
- major modules work end-to-end
- AI cannot bypass authorization
- whiteboard does not corrupt data
- autosave works reliably
- dark/light themes are polished
- mobile experience is usable
- errors are observable
- critical flows are tested
- users can export their data
- destructive operations are protected
- secrets are never exposed
- deployment is reproducible

---

# 53. Final Product Model

وثّقلي should ultimately feel like this:

```text
                    وَثِّقْلِي
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       KNOWLEDGE      EXECUTION       BUSINESS
          │              │              │
       Notes          Goals            CRM
       Research       Plans            Contacts
       Files          Tasks            Deals
       Bookmarks      Projects         Meetings
          │              │              │
          └──────────────┼──────────────┘
                         │
                      CREATIVE
                         │
                  Whiteboard
                  Mind Maps
                         │
                         ▼
                       AI CORE
                         │
                  Memory + RAG
                         │
                         ▼
                    AUTOMATION
                         │
                         ▼
                       TEAM
```

The long-term goal is not to replace every application.

The goal is to become the **system that connects the important parts of the user's work and life**.

---

# 54. Immediate Build Order

Build in exactly this order:

```text
1. Repository + architecture
2. Design system + theme
3. Supabase project
4. Database schema
5. Authentication
6. Workspace model
7. RLS policies
8. App shell
9. Home
10. Goals
11. Tasks
12. Projects
13. Planning
14. Calendar
15. Notes / Tiptap
16. Search
17. Files
18. CRM
19. Meetings
20. Content
21. Whiteboard
22. Mind Maps
23. AI
24. Memory
25. Automations
26. Notifications
27. Analytics
28. Team / permissions
29. Integrations
30. Production hardening
```

**Important:** Do not start coding the Whiteboard before the application's core data model and workspace authorization model are stable.

---

# 55. Source of Truth

This document is the initial product and architecture source of truth for وثّقلي.

When implementation decisions conflict with this document:

1. Protect user data.
2. Protect workspace isolation.
3. Preserve the connected-data model.
4. Prefer simpler architecture.
5. Preserve future extensibility.
6. Avoid unnecessary scope.
7. Update this document when a deliberate architectural decision changes the product.