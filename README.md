# 📸 BriefBuilder

**A comprehensive photography brief, shot list, and call sheet builder for photographers, clients, and producers.**

BriefBuilder helps you create professional photography project briefs with intelligent features powered by AI, pre-built templates, and collaborative tools.

## ✨ Features

### 🎯 Core Features
- **Multi-role support**: Optimized workflows for Clients, Photographers, and Producers
- **6 Pre-built Templates**: Commercial Product, Corporate Events, Food & Beverage, Fashion, Real Estate, Wedding/Lifestyle
- **Auto-save**: Never lose your work with automatic draft saving every 30 seconds
- **Smart Shot Lists**: Drag-and-drop reordering, categorization, time estimates, status tracking
- **Equipment Management**: Categorized checklists with rental tracking and pack/unpack status
- **Line-item Budgeting**: Detailed budget builder with multiple currencies
- **AI-Powered**: Generate ideas, shot lists, schedules, and get expert analysis

### 📤 Export & Sharing
- **Enhanced PDF**: Professional cover pages, branding, watermarks
- **Calendar Integration**: iCal and Google Calendar export
- **Multiple Formats**: JSON, CSV, Markdown
- **QR Codes**: Generate shareable QR codes for mobile access
- **Email Delivery**: Send briefs directly to stakeholders

### 🤖 AI Capabilities
- Brief analysis and improvement suggestions
- Budget reasonableness checks
- Shot list generation from project description
- Shot ideas from reference images (vision AI)
- Schedule generation from crew and shots
- Risk assessment
- Equipment recommendations
- Terminology explanations for clients

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/bard108/briefbuilder.git
cd briefbuilder
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM=noreply@yourdomain.com
```

Get your API keys:
- **Gemini API**: [https://ai.google.dev/](https://ai.google.dev/)
- **Resend API**: [https://resend.com/](https://resend.com/)

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
briefbuilder/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── gemini/          # AI integration
│   │   └── email/           # Email sending
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── brief-builder.tsx    # Main application
│   ├── client-info-step.tsx # Client info form
│   ├── ui/                  # Reusable UI components
│   │   ├── sortable-shot-list.tsx
│   │   ├── template-selector.tsx
│   │   ├── progress-indicator.tsx
│   │   ├── equipment-checklist.tsx
│   │   └── budget-builder.tsx
│   └── steps/               # Wizard step components
├── lib/                     # Core library code
│   ├── stores/              # State management (Zustand)
│   ├── schemas/             # Data schemas (Zod)
│   ├── templates/           # Pre-built templates
│   ├── utils/               # Utility functions
│   │   ├── pdf-generator.ts
│   │   ├── calendar-export.ts
│   │   ├── export-utils.ts
│   │   └── ai-helpers.ts
│   └── hooks/               # Custom React hooks
└── public/                  # Static assets
```

## 🎨 Using Templates

BriefBuilder includes 6 professionally crafted templates:

1. **Commercial Product Photography** - E-commerce and product marketing
2. **Corporate Event Coverage** - Conferences, meetings, team events
3. **Food & Beverage Photography** - Restaurant menus, cookbooks
4. **Fashion & Editorial** - Fashion campaigns, lookbooks
5. **Real Estate & Architectural** - Property listings, interiors
6. **Wedding & Lifestyle** - Weddings, engagements, family portraits

Each template includes:
- Pre-filled project details
- Sample shot lists with categories
- Recommended equipment
- Suggested crew roles
- Typical objectives and audience

## 🛠️ Development

### Build for Production
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## 📚 Documentation

For detailed feature documentation, see [FEATURES.md](./FEATURES.md).

## 🎯 Roadmap

- [x] Core brief builder functionality
- [x] Multi-role support
- [x] Template system
- [x] Auto-save and draft management
- [x] Enhanced PDF generation
- [x] AI integration
- [x] Equipment and budget management
- [ ] Weather API integration
- [ ] Multi-user collaboration
- [ ] Version history
- [ ] Mobile app
- [ ] Analytics dashboard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## Environment variables

This project requires a few server-side environment variables for the API routes to work:

- `GEMINI_API_KEY` — API key for the Gemini / Google Generative API (used by `/api/gemini`).
- `RESEND_API_KEY` — API key for Resend (used by `/api/email`).
- `RESEND_FROM` — Verified sender email address for Resend.

Create a `.env` in the project root (do not commit it) or set these in your deployment platform. See `.env.example` for an example.
