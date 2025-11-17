# Poster

A Next.js application for AI-powered content creation including text summarization and image generation across multiple projects.

## Overview

Poster is a web application that allows users to organize and generate AI-powered content. Users can create multiple projects, and within each project, use various AI tools for text summarization and image generation using Grok AI and Leonardo.ai.

## Recent Updates

**Phoenix Model Support (November 2024)**
- Added Leonardo Phoenix model with enhanced architecture
- Implemented 24 style UUID options for Phoenix (3D Render, Bokeh, Cinematic, etc.)
- Added adjustable contrast parameter (0-10) for Phoenix generations
- Conditional UI: PhotoReal/Preset Styles for SDXL, Style UUID/Contrast for Phoenix
- Renamed "Strength Type" to "Level of Consistency" for clarity
- Changed default consistency from Mid to High
- Added Number of Images option (1-4 per generation)
- Database-driven style controls for easy expansion

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js v5 (Google OAuth only)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **AI Services**:
  - Grok AI (xAI) via OpenAI SDK - Text summarization with web search
  - Leonardo.ai API - Image generation and character-consistent imaging
- **Storage**: Vercel Blob - Permanent image storage
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
- Delete projects (cascades to associated content)
- Dedicated "Manage Projects" interface

### Tool 1: Text Summarizer
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

### Tool 2: Text to Image
- Generate images from text prompts using Leonardo.ai
- 1-10 images per generation
- 1024x768 resolution (JPG format)
- Auto-generated descriptive titles
- Generation history per project
- Edit prompts and regenerate
- Delete generations with confirmation
- Persistent image storage

### Tool 3: Character Consistent Image
- Generate images with consistent character appearance
- Upload reference image for character consistency
- Reference images permanently stored in Vercel Blob
- Database-driven model selection:
  - Leonardo Lightning XL (default)
  - Leonardo Kino XL
  - Leonardo Vision XL
  - Leonardo Anime XL
  - Leonardo Phoenix (newer architecture with enhanced controls)
- Customizable settings:
  - Prompt for image generation
  - Level of Consistency (Low/Mid/High) - defaults to High
  - Number of images per generation (1-4)
  - Multiple dimension options (512x512 to 1024x1024)
  - Style controls (model-dependent):
    - SDXL models: PhotoReal enhancement + Preset Styles (Cinematic, Creative, Portrait, etc.)
    - Phoenix model: Style UUID selection + Contrast adjustment
- Auto-generated descriptive titles
- Generation history with reference image preview
- Edit and regenerate with same or new reference image
- Delete generations with confirmation

### User Interface
- **Top Header Bar**:
  - "Poster" branding
  - User profile image, name, and email
  - Account Settings button
  - Sign Out button
- **Left Sidebar**:
  - Projects dropdown with create and manage options
  - Tools dropdown for navigation between tools
  - Tool-specific content lists (summaries, image generations, character generations)
  - "+ New" button to start fresh generations
- **Main Content Area**:
  - Tool forms with validation
  - Generated content display
  - Real-time updates
  - Visual preview of reference images and generated content
- **Additional Features**:
  - Inline project creation
  - Hover-to-delete functionality with confirmation modals
  - Context-based sidebar content updates per tool
  - Responsive layout with server/client component architecture

## Database Schema

### Users & Authentication
- Standard NextAuth.js user model
- Google OAuth integration
- Account and session tables

### Projects
- Name and description
- User ownership
- Created/updated timestamps
- Cascade relationships to all content

### Tools
- Predefined tools (Text summarizer, Text to Image, Character Consistent Image)
- Seeded on database initialization

### Text Summaries
- Associated with project and user
- Auto-generated name/title
- Website URL (optional)
- Text content (optional)
- Target word count
- AI-generated summary
- Created/updated timestamps

### Image Generation Requests
- Associated with project and user
- Auto-generated name/title
- Text prompt
- Number of images
- Generated images (one-to-many relationship)
- Created/updated timestamps

### Character Consistent Image Requests
- Associated with project and user
- Auto-generated name/title
- Text prompt
- Reference image URL (Vercel Blob)
- Leonardo image ID
- Strength type/Level of Consistency (Low/Mid/High)
- Model ID (references leonardo_models table)
- Dimensions (width/height)
- Number of images (1-4)
- PhotoReal and Alchemy settings (SDXL models only)
- Preset style (SDXL models)
- Style UUID and Contrast (Phoenix model)
- Generated images (one-to-many relationship)
- Created/updated timestamps

### Leonardo Models
- Database-driven model configuration
- Model name and ID
- Preprocessor ID for ControlNets
- PhotoReal and Alchemy compatibility settings
- Style control type (presetStyle or styleUUID)
- Contrast requirements (Phoenix model)
- Active status and display order
- Easy to add new models without code changes

### Leonardo Style Controls
- Database-driven style options
- Style control parameter (presetStyle or styleUUID)
- Style option label and UUID
- Display order
- Supports both SDXL preset styles and Phoenix style UUIDs

### Generated Images
- Associated with image generation requests
- Image URLs
- Created/updated timestamps

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Google OAuth credentials
- xAI API key for Grok
- Leonardo.ai API key
- Vercel Blob storage token

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

# Leonardo.ai
LEONARDO_API_KEY="your-leonardo-api-key"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial tools, Leonardo models, and style controls
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
│   ├── api/                           # API routes
│   │   ├── projects/                  # Project CRUD
│   │   ├── text-summaries/            # Summary CRUD
│   │   ├── image-generations/         # Image generation CRUD
│   │   ├── character-consistent-generations/ # Character imaging CRUD
│   │   ├── leonardo-models/           # Model configuration API
│   │   └── leonardo-style-controls/   # Style controls API (presetStyle/styleUUID)
│   ├── components/                    # Shared React components
│   │   ├── manage-projects.tsx        # Project management UI
│   │   └── DeleteConfirmModal.tsx     # Reusable delete confirmation
│   ├── tools/                         # Tools section
│   │   ├── layout.tsx                 # Server component layout (fetches session)
│   │   ├── ToolsLayoutClient.tsx      # Client component with UI logic
│   │   ├── ProjectContext.tsx         # Project and sidebar state context
│   │   ├── text-summarizer/
│   │   │   └── page.tsx               # Text summarizer tool
│   │   ├── text-to-image/
│   │   │   └── page.tsx               # Text to image tool
│   │   └── character-consistent-image/
│   │       └── page.tsx               # Character consistent tool
│   └── page.tsx                       # Home page
├── lib/
│   └── prisma.ts                      # Prisma client
├── prisma/
│   ├── schema.prisma                  # Database schema
│   ├── migrations/                    # Database migrations
│   └── seed.ts                        # Database seeding
└── auth.ts                            # NextAuth configuration
```

## Architecture

### Component Structure
The application uses Next.js 16's App Router with a clear separation between server and client components:

- **Server Components** (`app/tools/layout.tsx`):
  - Fetches user session using `auth()` from NextAuth.js
  - Passes session data to client components as props
  - No client-side state or hooks

- **Client Components** (`app/tools/ToolsLayoutClient.tsx`):
  - Handles all UI logic and interactivity
  - Manages project selection and tool navigation
  - Renders header, sidebar, and main content areas
  - Receives session data from server component

### State Management
- **ProjectContext** (`app/tools/ProjectContext.tsx`):
  - React Context for global project state
  - Manages selected project across all tools
  - Provides `setSidebarContent` for dynamic sidebar updates
  - Each tool page sets its own sidebar content via `useEffect`

### Tool Pages
Each tool is a separate route with its own page component:
- `text-summarizer/page.tsx` - Text summarization tool
- `text-to-image/page.tsx` - Image generation tool
- `character-consistent-image/page.tsx` - Character-consistent imaging tool

Tool pages:
- Use `useProject()` hook to access project context
- Set sidebar content dynamically via `setSidebarContent()`
- Render only the main content area (forms and results)
- Clear sidebar content on unmount

## Key Features in Detail

### Text Summarization
- Uses Grok-4-fast-non-reasoning model
- Automatic web search for URL-based summaries
- Maintains conversation context
- Respects target word count parameters
- Generates concise, descriptive titles

### Image Generation
- Leonardo.ai integration via REST API
- Configurable number of images (1-10)
- Fixed dimensions optimized for quality
- Automatic polling for generation completion
- Persistent storage of generated images

### Character-Consistent Imaging
- Upload reference images for character consistency
- Reference images stored permanently in Vercel Blob
- Leonardo.ai Character Reference ControlNet (model-specific preprocessors)
- Database-driven model selection:
  - SDXL models (preprocessor 133): Lightning XL, Kino XL, Vision XL, Anime XL
  - Phoenix model (preprocessor 397): Enhanced architecture with style controls
  - Each model has specific configuration (preprocessorId, photoRealVersion, styleControl, etc.)
  - Easy to add new models via database without code changes
- Advanced style controls:
  - SDXL models: PhotoReal v2 enhancement + 9 preset styles (Cinematic, Creative, Portrait, etc.)
  - Phoenix model: 24 style UUID options + adjustable contrast (0-10)
- Configurable level of consistency (Low/Mid/High) - defaults to High
- Generate 1-4 images per request
- Multiple dimension options (512x512 to 1024x1024)
- 30-60 second generation time
- Automatic polling and status updates

### Form Behavior
- Fields persist during submission (greyed out)
- Validation prevents submission without required data
- Auto-clears when switching projects
- Updates existing content when re-submitted
- Creates new content when "+ New" is clicked
- File input properly resets on form clear

### Project Workflow
1. User logs in with Google
2. Creates or selects a project
3. Chooses a tool (Text Summarizer, Text to Image, or Character Consistent Image)
4. Generates content (saved automatically)
5. Access content history via sidebar
6. Edit/regenerate or delete previous generations
7. Manage projects via dropdown option

## API Integration Details

### Leonardo.ai Workflow
1. Upload reference image to Vercel Blob (permanent storage)
2. Get presigned URL from Leonardo.ai
3. Upload image to Leonardo's S3 via presigned URL
4. Submit generation request with ControlNet configuration
5. Poll generation status (every 3 seconds, max 40 attempts)
6. Store generated image URLs in database
7. Display results to user

### Model Configuration
- Models stored in `leonardo_models` table
- Each model defines:
  - Model ID and name
  - Preprocessor ID for ControlNets
  - PhotoReal compatibility and version
  - Alchemy compatibility
  - Style control type (presetStyle or styleUUID)
  - Contrast requirements and defaults
  - Active status and display order
- Style controls stored in `leonardo_style_controls` table
- Two types of style controls:
  - presetStyle: SDXL models (9 options like CINEMATIC, PORTRAIT, ANIME)
  - styleUUID: Phoenix model (24 options with unique UUIDs)
- API routes dynamically fetch model and style configuration
- Frontend adapts UI based on selected model's capabilities

## Security

- All API routes require authentication
- Users can only access their own projects and content
- Project/content ownership verified before modifications
- Cascade deletes protect data integrity
- HTTPS enforced in production
- Vercel Blob storage with public access for images

## Deployment

Deployed on Vercel with:
- Automatic deployments from Git
- Neon PostgreSQL integration
- Vercel Blob storage integration
- Environment variables configured in Vercel dashboard
- Google OAuth redirect URIs for both localhost and production

Production URL: `https://poster-pi-azure.vercel.app`

## Vercel Blob Storage

- Storage name: `poster-storage`
- Used for permanent reference image storage
- Public access enabled for image viewing
- Connected to production environment
- Automatic cleanup not enabled (images persist)

## Future Enhancements

Potential features for future development:
- Additional AI models and tools
- Image editing and manipulation tools
- Export content (PDF, markdown, ZIP)
- Content sharing/collaboration
- Usage analytics and metrics
- Custom AI model parameters
- Batch processing
- Content comparison tools
- Additional Leonardo.ai models (Diffusion XL, Diffusion 1.5, etc.)
- Image upscaling and refinement
- Additional style transfer and variations
- Image-to-image transformations
- Motion/video generation capabilities

## License

Private project - All rights reserved.
