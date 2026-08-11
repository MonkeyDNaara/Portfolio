# Portfolio Website

My personal developer portfolio — built from scratch with plain HTML, CSS and a bit of JS, no frameworks. Started this as the "main" project to show off everything else I build during the WBS Software Engineering & AI course, but it's also just been a good excuse to get comfortable with CSS structure before jumping into frameworks.

🔗 Live version: coming soon (deploying via GitHub Pages)

## Why plain HTML/CSS and not React?

Mostly on purpose. I wanted one project where I fully control the layout system myself — custom properties for theming, a shared header/footer across pages, active-nav-state handling — before I lean on a framework to do that for me. Once this is stable I'll probably rebuild parts of it in React just to compare the two approaches.

## Structure

```
Portfolio/
├── index.html      # Home
├── about.html      # About me
├── skills.html     # Skill bars (Front-End / Back-End)
├── projects.html   # Links out to my other repos
└── styles/
    ├── style.css    # CSS variables + base resets, imports the rest
    ├── header.css   # Nav bar, active-link highlighting
    ├── main.css     # Page content + the skill bar component
    └── footer.css
```

Each page pulls in `styles/style.css`, which itself imports header/main/footer. All the colors, spacing and header/footer height live in `:root` custom properties so the whole site can be re-themed from one place.

## Current status

Still very much in progress:
- [ ] About and Projects pages are placeholder ("Coming Soon") right now
- [ ] Skills page needs real percentages / more categories once I'm further into the course
- [ ] Login button in the header doesn't do anything yet — thinking about whether it's even worth keeping or if it's more of a "look, I know how to build this" gimmick
- [ ] Resume link, real email and LinkedIn still need to go in
- [ ] Deploy to GitHub Pages once the above is done

## Stack

HTML5, CSS3 (custom properties, no preprocessor), vanilla JS for the interactive bits.

## About me

Career-changer moving from mechanical/automation engineering (2+ years working with Siemens TIA Portal and SAP) into software development. Currently in the WBS Coding School Software Engineering & AI program, working toward a junior full-stack or back-end role.
