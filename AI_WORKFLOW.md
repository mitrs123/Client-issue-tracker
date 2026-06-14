# AI Workflow Documentation

This document describes how AI-assisted tools were used during the development of the Client Issue Tracker.

## 1. AI Tools Used

| Tool | Role |
|------|------|
| **Gemini** | Used as a Prompt Enhancer/Engineer to brainstorm and refine the initial requirements into a detailed prompt for generating the MASTER_PLAN.md and CLAUDE_RULES.md. |
| **Claude Code extension** | Primary engineering agent for code generation, architecture, backend/frontend development, and used to generate the screen prompts (`PROMPT_FOR_ALL_SCREENS.md`). |
| **Antigravity** | Used as the primary code IDE to assist with the development workflow. |
| **Self-developed IDE extension** | A custom extension (usable in VS Code and Antigravity) providing an in-IDE browser and UI that allows selecting components to directly show the corresponding file, code lines, and CSS. This made manual UI tweaks fast and easy. |
| **Google Stitch** | Used for generating the UI designs based on the prompts, resulting in the "Stark Modern" screen designs stored in the `Stitch Design` folder. |
| **Design system extractor (Chrome extension)** | Used to extract the design system, colors, and styling directly from `pixel-future.com`. |
| **Vercel AI SDK (v6)** | Runtime LLM integration in the product itself (multi-provider issue analysis). |

*(Note: We did not use v0.dev for UI generation in this project.)*

## 2. Sample Prompts

### 🏛️ Architecture & System Design
- **Initial brainstorming with Gemini** to generate project rules and the master plan:
  > *"Act as an Prompt Enhancer or Prompt Engineer so here i attached a requirement here in this mentioned a my requirement brief and here in this what i want a here in only two roles whci Client and Manager and name is client issue tracker here and it's stack is next js,tailwind css, typescript with the shadcnui next router, postgres with supabase and currently we only use here supaabse for the database hosting if need a production ready then we able use other system of supabase via plain connection string and use prisma orm and create a custom oath via bcrypt and here jwt token not store in the local storage wchi is not a feasible for the security so use httponly cookines with the samesite this thigns need to configure in the vecel json in and then here configure for the ai integration here we need to use a multiple llm model where a gemini, openapi, claude and also integrate a operouter api where here if not above any form ther three then fallback in oper router and here note that if not any env variable get then not broke the whole server only theri feature of fucntionality down only and also for the rpoduction readiness in we able to usea vercel sdk for the multiple llm provider integration then here use a and and for the smtp all four htigns is is a make a env in so user can setup any nodemailer in and here we can iuse design from the v0.dev custom created wchi is allign with the pixel-future.com this and and  in code qaulity in need to inpelemnt a not a use any unless absolutely necessory and both side need a zod validation if required then make shared zod for teh validation and all bsuiness logic write in the service file in not routes in and not any time cleint compoenet call from the database and nit a any env expose via frontend here use graceful degradation for the missing environemtn and make a RABC for the all endpoint standard output and also for the api resposne error respionse use utility and also here in memory and also mentioned invthe production ready in where we use a redis or upstach for the rate limiting and cache and fro teh automated abuse prevention here use a recaptcha by the google and database in use a prisma orm and also need a created_at and updated_at and here username i want a unique and as well as issue no unique  and not do hard delete any thigns if required then do soft delete and we need to every history of all events so make proepr schema and for this specific and here not need we impelemt and also here we used normalized 3nf database desiong approach and need to desing a production grade databse ssytem but we use for the notifcaiton que here we use here some like that which is not blcok the resposne and error logign then here we need to implement a notification where use a create issue and resolve like need to via mail other via the in app notification currenly we nit use a societk io but if we have implemnt on server then here our limitation is here we use vercel for the deployment fress versoion so not able to use socket io and also here vapid api use for the push notification it's developed i this and here in the desibase desing in make sure where like in the one cahnges in multiople table in change than use trasaction or seesion like if succesful then use in all table other wise not cahnge in anytable in then also we need to implement here how to use ai where a client fill title , desctrioptin description is manadator for the ai use where show enhacned via ai where show ther proper desctipritn title severnity category and then frimthe when come in the maanger side at time show severnity, category, recommndede Actions[], suggested ressposne and summary and if and when ai fail to respose then never block a form paege ot ui degrades and ai output is suggestion-only here use//manager applies or edits it nothign auto submited and for the storage use a s3 via presigned url here and also both is expirty where uplaod is 2 min and dpnalaod is 5 min and fiel key create liek a website website id issue issue id and then alois in this add randlom string then extension and also per issue max 5 fiel and eacj have 10mb limit and image,pdf,txt,log,excel,word,docx acceprt and same whenr any env field missing at time also formt he friendside also disavled that dfeature and also here what is keep in mind where developed the system where also need to optimiziation we do after code also but waht in the in the mind whci consider in also in development at time debouncind becuase here we use global search wchi is in the nvabar so ehre put a debouucing , server size pagination 20 per page , databse indexing, lazy loading where required , Api response optiomization, caching , caching data lieke notification and dasboard count like , polling optimixaitoin becuse here we have limitaiton for the socekt io fir the in appp notificaiton so dio this thigns every 30 secondonely poll where suer logged in or broweser tab active other wise if user give opersmissin fir the web push notification that time give on that , Rate limmiting , single ai call where one ai call all field s data pooled, background email leik whci is not block the response, fiel upload o[ptimization, code splititing, and use a dyanmic import, image optimization use next/iamge, form validation for the mermission and task like whic task perform by the manager and cleint which is int he specificaiton ot task in and for the testing before completing any issue test via npm run lint and tsc --n0Emit must pass also permissino test liek what role what able to do and what don't and here dont assume assume anythign where you need or not udnerstand stop and waiting for the my reply and also here we used a genrsator function type of like yield stop and ask for the cofirmation and wait for the user approval becuse here i want to check fleo is okay or not any mistake done by like approch we used here and after completed implementataion create readme.md wehre write in this setup, run, demo credential,,assumption" where need ti verifiy me ause take suggestion me first create db where need confirm with me then sstart backend desing then need to me api and which data show to the user like the the from the this data or from the suggestion i crreate a desing from the v0.dev then impelemt frontend , and also n this need to implement a security and scalling consideration and also  create rules file for the  claude code extension and where you found loop the add thios things in this and output iN i want a single master FILE like amd where all things are mentioned and another where i put a claude rules for this project do this thigns"*
  *(Note: Given to Gemini as-is, this prompt successfully generated the `.clauderules` and `MASTER_PLAN.md`. The workflow then progressed through 5-6 rounds of human confirmation and feedback before completion.)*
- *"Start and follow the `.clauderules`, `MASTER_PLAN.md`, `specification.docx`, `Task.docx`."*

### 🗄️ Database Design
- *"Phase 1: Propose the Prisma schema based on the Master Plan."* 
- *"Add `assignedManagerId` to Issue, strengthen Attachment metadata, add AI traceability fields, improve Notification delivery/read tracking, ensure IssueEvent covers the full lifecycle."*

### ⚙️ Backend Development
- *"Proceed to Phase 2: Backend & Auth."*
- *"Add in-memory rate limiting via headers; verify a 429 with Retry-After."*
- *"Start Phase 4 (Integration)."* (For AI, S3, and notification email/push implementations)

### 🎨 Frontend Development
- *(During Phase 3)*: Generated design prompts via Claude, which were compiled into `PROMPT_FOR_ALL_SCREENS.md`. Those prompts were processed through Google Stitch to generate the UI designs (located in the `Stitch Design` folder).
- *"Implement all Stitch screen designs pixel-for-pixel, then continue Phase 3."*
- *"Finish the pixel-perfect pass on every screen; use space wisely — too much padding/whitespace everywhere; fix the font warning."*

### ♻️ Refactoring
- *"Use space wisely — too much padding everywhere."* (Tightened global spacing rhythm)
- *"Keep Prisma out of client components; use the services layer."* (Ensured server components fetched via `/services` and client components called `apiFetch`).

### 🚀 Production Readiness
- *"Add rate limit to the issue status + severity update routes; verify it returns 429 with Retry-After; add Google reCAPTCHA + testing; re-run npm audit."*
- *"Go ahead for Phase 5 (Pre-Flight)."* (Configured security headers, automated RBAC gate tests, checked build and audit).

## 3. AI Reflection

### ✅ Successful outputs
- **Phase 1 schema** generated cleanly: 9 models, enums, audit/timeline table, soft-delete columns, and indexes.
- **Phase 2 backend** compiled successfully with strict TypeScript (`tsc --noEmit` clean, 0 errors).
- **Architecture discipline held:** All business logic correctly located in `/services` and isolated from the client components.
- **Atomicity:** Multi-table operations successfully run inside Prisma `$transaction`.
- **Integrations:** Phase 4 integrations compiled cleanly with every feature behind an env flag.

### ❌ Rejected outputs
- **`AiProvider` enum** — rejected in favor of free-form `provider String` so bonus providers need no migration.
- **Prisma `autoincrement()` for `issueNo`** — not allowed on non-`@id` fields; replaced with a transaction-scoped generator.
- **npm's suggested audit "fix" (`next@9.3.3`)** — rejected as a nonsensical downgrade.
- **Separate `@openrouter/ai-sdk-provider` package** — rejected; OpenRouter is OpenAI-compatible, so reused `@ai-sdk/openai`.

### ✏️ Manual corrections
- Added five schema strengthenings (e.g., `assignedManagerId`, attachment metadata, AI traceability).
- Removed Upstash dependency in favor of **in-memory rate limiting** based on header IP.
- Handled UI layout spacing manually to fix excessive whitespace.
- **UI Tweaks**: Added manual tweaks to design and UI. These manual tweaks were made extremely fast and easy using our self-developed browser picker extension, allowing direct element-to-code correlation inside the IDE.

### 💡 Lessons learned
- Gating + a living log keeps a large AI build reviewable and on-track.
- Next.js `15.1.6` shipped with a published CVE, requiring a minor bump to `15.5.19`.
- The Yield & Confirm gate was perfect for confirming database refinements before committing to backend routes.
- Frontend components should remain presentational + server-fetched, utilizing the `/services` layer to securely abstract DB operations.

## 4. AI Efficiency

- **Approximate prompt count:** ~10 user prompts (+ Stitch design-tool prompts in Phase 3).
- **Approximate development turns:** ~8 major turns across the 5 phases.
- **Estimated productivity improvements:** ~85% time saved compared to manually writing the schema, auth, services, full UI, integrations, tooling, tests, and documentation.
