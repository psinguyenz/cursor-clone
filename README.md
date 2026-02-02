# Polaris AI

https://polaris-engine.vercel.app/
A professional, AI-powered application builder that enables users to create and manage software projects through natural language. Built with Next.js 16, Convex, and WebContainer API for a seamless, real-time development experience directly in the browser.

## 🚀 Features

- **AI-Driven Development**: Chat with advanced AI models (Gemini, OpenAI) to generate code, build features, and refactor applications.
- **Real-time Collaboration**: Instant synchronization across all components and files powered by Convex real-time backend.
- **In-Browser Sandbox**: Execute and preview web applications securely within the browser using WebContainer API.
- **Integrated Full-featured IDE**: Modern code editing experience with CodeMirror, syntax highlighting, and a familiar file explorer structure.
- **Live Terminal**: Integrated xterm.js terminal for direct interaction with the sandboxed environment.
- **Project & Conversation Management**: Effortlessly organize multiple projects and maintain a history of AI-assisted conversations.
- **Smart Context**: Leverages Firecrawl for web crawling to provide AI with up-to-date documentation and external context.
- **Authentication & Security**: Robust user authentication and session management integrated with Clerk.

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16.1.1** - React framework with App Router and Turbopack
- **React 19.2.3** - Modern UI library
- **TypeScript 5** - Type-safe development

### Real-time Backend & Database
- **Convex 1.31.2** - Real-time database and serverless backend functions
- **Clerk** - User authentication and management
- **Inngest** - Event-driven background job processing and AI agent orchestration

### AI & Execution
- **AI SDK** - Support for Google Gemini and OpenAI models
- **WebContainer API** - In-browser execution of Node.js environments
- **Firecrawl** - Web crawling for AI context gathering

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn UI** - Reusable accessible component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - High-quality icon library
- **Framer Motion** - Dynamic animations and transitions

### Editor & Terminal
- **CodeMirror 6** - Extensible modern code editor
- **xterm.js** - Terminal emulator for the browser
- **Shiki** - Powerful syntax highlighter

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm**, **yarn**, **pnpm**, or **bun**
- **Convex** account (for backend)
- **Clerk** account (for authentication)
- **OpenAI/Google AI** API keys (for AI features)
- **Firecrawl** account (for web search/crawling)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/polaris.git
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Convex
   CONVEX_DEPLOYMENT=your_convex_deployment_id
   NEXT_PUBLIC_CONVEX_URL=your_convex_url

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # AI Keys
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
   OPENAI_API_KEY=your_openai_key

   # Firecrawl
   FIRECRAWL_API_KEY=your_firecrawl_key

   # Inngest
   INNGEST_EVENT_KEY=your_inngest_event_key
   INNGEST_SIGNING_KEY=your_inngest_signing_key
   ```

4. **Initialize Convex**
   ```bash
   npx convex dev
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Directory Structure

```
polaris/
├── convex/                          # Convex backend functions and schema
│   ├── _generated/                  # Generated Convex types
│   ├── auth.config.ts               # Auth configuration
│   ├── schema.ts                    # Database schema definition
│   └── *.ts                         # Backend queries and mutations
│
├── public/                          # Static assets
│
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── api/                     # API routes (Inngest, Webhooks)
│   │   ├── projects/
│   │   │   └── [projectId]/         # Project-specific workspace
│   │   ├── globals.css              # Global styles
│   │   └── layout.tsx               # Root layout
│   │
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # Shadcn UI primitives
│   │   └── ...                      # Common components (terminal, explorer)
│   │
│   ├── features/                    # Domain-specific modules
│   │   ├── auth/                    # Authentication components and logic
│   │   ├── conversations/           # Chat interface and AI message logic
│   │   ├── editor/                  # CodeMirror integration and file editing
│   │   ├── preview/                 # WebContainer sandbox and preview UI
│   │   └── projects/                # Project management and views
│   │
│   ├── hooks/                       # Custom React hooks
│   ├── inngest/                     # Background jobs and AI agent definitions
│   ├── lib/                         # Utility functions and shared libraries
│   └── types.ts                     # Global TypeScript definitions
│
├── components.json                  # Shadcn UI configuration
├── next.config.ts                   # Next.js configuration
├── package.json                     # Project dependencies
└── tsconfig.json                    # TypeScript configuration
```

## 🗄️ Database Schema

The application uses Convex for real-time data storage. Key tables include:

- **Projects**: Stores project metadata, ownership information, and deployment status.
- **Files**: Hierarchical file system storage for project source code.
- **Conversations**: Grouping of AI-assisted development sessions.
- **Messages**: Individual messages with processing status and AI responses.

## 🚦 Available Scripts

- `npm run dev` - Start Next.js development server
- `npx convex dev` - Start Convex development environment
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## 🔐 Security & Monitoring

- **Clerk**: Secure enterprise-grade authentication.
- **Sentry**: Comprehensive error tracking and performance monitoring for both client and server.
- **WebContainer**: Secure execution of code in an isolated browser process.

## 🏗️ Architecture

Polaris follows a **Feature-Based Architecture**:

- **Decoupled Features**: Logic is organized into self-contained features (Editor, Preview, Projects) to ensure maintainability.
- **Real-time Sync**: Every state change is reflected instantly across the UI via Convex's reactive queries.
- **Modular Backend**: Convex functions handle business logic on the server, ensuring type safety from DB to UI.

---

Built with ❤️ using Next.js, Convex, and Modern AI tech.
