# AARNA CLUB WEBSITE - SETUP AND REQUIREMENTS

## Overview
This document contains the step-by-step setup commands and full requirements for the Aarna Club frontend project. It ensures that the development environment is properly initialized for AI and human developers.

## Tech Stack
- **Framework:** React 19 + Vite
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion, GSAP, Lenis, Lottie React
- **API:** Axios
- **Icons:** React Icons / Lucide React
- **Forms:** React Hook Form, Zod
- **Scroll Detection:** React Intersection Observer
- **Statistics:** React CountUp
- **Utilities:** clsx, tailwind-merge

## Initialization Commands
Run these commands in your terminal to set up the project:

```bash
# 1. Create Vite Project (assuming you are inside the parent directory or need to initialize in current)
npm create vite@latest . -- --template react

# 2. Install Core Dependencies
npm install react-router-dom axios framer-motion gsap lenis react-icons lucide-react react-hook-form zod react-countup react-intersection-observer lottie-react clsx tailwind-merge

# 3. Install Tailwind CSS and its dependencies
npm install -D tailwindcss postcss autoprefixer

# 4. Initialize Tailwind Config
npx tailwindcss init -p
```

## Recommended VS Code Extensions
Make sure the following extensions are installed in your workspace:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Error Lens
- Auto Rename Tag
- Auto Close Tag
- Path IntelliSense
- Thunder Client (Optional)

## Project Structure Setup
Create the required folders inside `src/`:
```bash
mkdir -p src/assets src/animations src/components src/constants src/data src/hooks src/layouts src/pages src/services src/styles src/utils
```

## Component Flow & Page Structure
The following components must be built:
Navbar -> Hero -> About -> Vision -> Mission -> Domains -> Achievements -> Statistics -> Timeline -> Events -> Gallery -> Testimonials -> Team -> FAQ -> Registration -> Contact -> Footer

## Design Rules
- **Theme:** Modern, Minimal, Professional, Technology Inspired
- **Visuals:** Rounded Corners, Soft Shadows, Glassmorphism (Optional), Gradient Backgrounds, Dark + Light Theme Ready
- **Primary Colors:** Blue, Purple, Indigo
- **Accent Colors:** Cyan, White, Dark Gray
- **Fonts:** Inter, Poppins, Outfit, Space Grotesk

## Implementation Phases
**Phase 1:** Setup Project, Install Dependencies, Configure Tailwind, Create Folder Structure, Configure Routing.
**Phase 2:** Develop Navbar, Hero, About, Mission, Vision, Domains.
**Phase 3:** Develop Timeline, Gallery, Statistics, Achievements, Testimonials.
**Phase 4:** Registration Form, Contact Form, API Integration, Google Sheets Integration.
**Phase 5:** Testing, Performance Optimization, Accessibility, Responsive Testing, SEO.
**Phase 6:** Deployment to Cloudflare Pages.
