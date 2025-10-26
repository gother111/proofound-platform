# Proofound MVP

A modern Payments Intelligence & CFO Forecasting Dashboard built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, and Supabase.

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn

### Setup Node.js 20 (if not already set)

Add Node.js 20 to your PATH permanently:

```bash
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Verify Node version:
```bash
node --version  # Should show v20.x.x
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
```

3. Run database migrations:
```bash
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
proofound-mvp/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility functions
│   ├── utils.ts        # Helper functions
│   └── supabase/       # Supabase client setup
├── prisma/             # Prisma schema
│   └── schema.prisma   # Database schema
└── public/             # Static assets

```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth

## 📝 Environment Variables

Create a `.env` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
```

## 🧪 Development

- Run dev server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Lint code: `npm run lint`

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
