# Poster

A Next.js application for managing AI-powered text summaries across multiple projects.

## Overview

Poster is a web application that allows users to organize and generate AI-powered text summaries. Users can create multiple projects, and within each project, generate summaries from websites or custom text using Grok AI.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js v5 (Google OAuth only)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **AI**: Grok AI (xAI) via OpenAI SDK with web search capabilities
- **Deployment**: Vercel

## Features

### Authentication
- Google OAuth sign-in (no email/password)
- Secure session management with JWT tokens
- User profile display with account settings

### Project Management
- Create multiple projects with names and descriptions
- Switch between projects via dropdown selector
- Edit project details (name and description)
- Delete projects (cascades to associated summaries)
- Dedicated "Manage Projects" interface

### Text Summarization Tool
- Generate AI-powered summaries using Grok AI
- Input options:
  - Website URL (Grok uses web search to access content)
  - Direct text input
  - Both website and text together
- Configurable target word count (1-5,000 words)
- Auto-generated descriptive titles (max 20 characters)
- Summary history per project
- Edit and regenerate existing summaries
- Delete summaries with confirmation

### User Interface
- Left sidebar with project and tool navigation
- Project-specific summary list
- Inline project creation
- Responsive form validation
- Hover-to-delete functionality
- Real-time updates

## Database Schema

### Users
- Standard NextAuth.js user model
- Google OAuth integration

### Projects
- Name and description
- User ownership
- Created/updated timestamps

### Text Summaries
- Associated with a project
- Auto-generated name/title
- Website URL (optional)
- Text content (optional)
- Target word count
- AI-generated summary
- Created/updated timestamps

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Google OAuth credentials
- xAI API key for Grok

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# xAI Grok
XAI_API_KEY="your-xai-api-key"
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial tools
npx prisma db seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (caution: deletes all data)
npx prisma migrate reset

# Open Prisma Studio to view data
npx prisma studio
```

## Project Structure

```
poster/
├── app/
│   ├── api/              # API routes
│   │   ├── projects/     # Project CRUD
│   │   └── text-summaries/ # Summary CRUD
│   ├── components/       # React components
│   │   └── manage-projects.tsx
│   ├── tools/           # Tools interface
│   │   └── tools-interface.tsx
│   └── page.tsx         # Home page
├── lib/
│   └── prisma.ts        # Prisma client
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
└── auth.ts             # NextAuth configuration
```

## Key Features in Detail

### AI Summary Generation
- Uses Grok-4-fast-non-reasoning model
- Automatic web search for URL-based summaries
- Maintains conversation context
- Respects target word count parameters
- Generates concise, descriptive titles

### Form Behavior
- Fields persist during submission (greyed out)
- Validation prevents submission without required data
- Auto-clears when switching projects
- Updates existing summaries when re-submitted
- Creates new summaries when "+ New" is clicked

### Project Workflow
1. User logs in with Google
2. Creates or selects a project
3. Uses Text Summarizer tool
4. Generates summaries (saved automatically)
5. Access summary history via sidebar
6. Manage projects via dropdown option

## Security

- All API routes require authentication
- Users can only access their own projects and summaries
- Project/summary ownership verified before modifications
- Cascade deletes protect data integrity
- HTTPS enforced in production

## Deployment

Deployed on Vercel with:
- Automatic deployments from Git
- Neon PostgreSQL integration
- Environment variables configured in Vercel dashboard
- Google OAuth redirect URIs for both localhost and production

Production URL: `https://poster-pi-azure.vercel.app`

## Future Enhancements

Potential features for future development:
- Additional summarization tools
- Export summaries (PDF, markdown)
- Summary sharing/collaboration
- Usage analytics and metrics
- Custom AI model parameters
- Batch processing
- Summary comparison tools

## License

Private project - All rights reserved.
