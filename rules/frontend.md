Aim: This document defines the frontend development rules and tech stack to ensure consistency throughout the Aarna Club website project.

Tech Stack & Constraints:
* Framework: React 19 + Vite.
* Routing: React Router DOM.
* Styling: Tailwind CSS. Avoid inline styles unless absolutely necessary.
* Animation: Framer Motion (Primary), GSAP (Advanced), Lenis (Smooth Scrolling), Lottie React.
* Forms & Validation: React Hook Form + Zod.
* State & API: Axios for all API communication. Frontend should NEVER directly access the database.
* Follow the defined project folder structure.
* Reuse components whenever possible. Do not duplicate UI code.
* All API communication must be done through the `services` folder.
* All reusable functions must be placed in the `utils` folder.
* All configuration values must be stored in the `config` folder.
* Do not hardcode URLs, API endpoints, or constants.
* Every page must be placed inside the `pages` folder.
* Components must contain only UI-related logic whenever possible.
* Global state must be managed only through the `contexts` folder.
* Custom hooks must be placed inside the `hooks` folder.
* Static assets must be stored inside the `assets` folder.
* Follow the project's Naming Convention document.
* Follow the project's API Schema document.

Design & Animation Rules:
* Theme: Modern, Minimal, Professional, Technology Inspired.
* Visuals: Use rounded corners, soft shadows, optional glassmorphism, and gradient backgrounds.
* Responsive: Must support Mobile, Tablet, Laptop, and Desktop using Tailwind responsive utilities.
* Themes: Must be Dark + Light Theme Ready.
* Typography: Use Inter, Poppins, Outfit, or Space Grotesk.
* Animations: Implement Fade In, Slide Up, Floating Elements, Blur on Scroll, Ripple Effects, Hover Glows, and Stagger Animations natively with Framer Motion.

General Rules:
* One component should have one primary responsibility.
* Keep components modular and reusable.
* Keep business logic outside UI components whenever possible.
* Validate user input before sending API requests.
* Handle loading, success, and error states for every API request.
* Display backend `report` messages directly to the user whenever applicable in the failure.
* Remove unused imports, variables, and components. Do not leave commented-out code.
* Do not hardcode sensitive information. Use Environment Variables (.env).
* Write clean, readable, and maintainable code.
* A proper comment should be present at the top of the file to define the use case of the files.
