import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Stack3D from "../components/Stack3D.jsx";
import { coreSkills, skillGroups } from "../data/profile.js";
import { localized, useLanguage } from "../i18n/LanguageProvider.jsx";
import { usePublishedProjects } from "../projects.jsx";
import useReveal from "../useReveal.js";
import useSpotlight from "../useSpotlight.js";
import useTilt from "../useTilt.js";

const ALL_SKILLS = skillGroups.flatMap((g) => g.items);
const byName = Object.fromEntries(ALL_SKILLS.map((s) => [s.name, s]));

// skill name -> published projects that use one of the skill's techs
function buildUsage(projects) {
  const usage = {};
  for (const skill of ALL_SKILLS) {
    const wanted = skill.techs.map((t) => t.toLowerCase());
    usage[skill.name] = (projects || []).filter((p) => p.techs.some((t) => wanted.includes(t.name.toLowerCase())));
  }
  return usage;
}

function initials(name) {
  return name.replace(/[^A-Za-z]/g, "").slice(0, 2);
}

/** Card with spotlight + tilt. */
function SkillCard({ className = "", style, children, labelledBy }) {
  const ref = useTilt({ max: 4 });
  useSpotlight(ref);
  return (
    <section ref={ref} className={`card skill-card tilt reveal ${className}`} style={style} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

export default function Skills() {
  const { lang, t } = useLanguage();
  const { projects } = usePublishedProjects();
  const usage = useMemo(() => buildUsage(projects), [projects]);
  const gridRef = useReveal();
  const [active, setActive] = useState(null); // { name, rect, pinned, el }
  const closeTimer = useRef(null);

  const cancelClose = () => clearTimeout(closeTimer.current);
  const close = useCallback(() => {
    clearTimeout(closeTimer.current);
    setActive(null);
  }, []);
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive((a) => (a?.pinned ? a : null)), 160);
  };
  function open(name, el, pinned = false) {
    cancelClose();
    setActive({ name, el, rect: el.getBoundingClientRect(), pinned });
  }
  function toggle(name, el) {
    if (active?.name === name && active.pinned) close();
    else open(name, el, true);
  }

  // Esc closes and gives focus back, scrolling or a click elsewhere closes too.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        active.el?.focus();
        close();
      }
    };
    const onDown = (e) => {
      if (!e.target.closest(".skill-btn, .skill-pop")) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [active, close]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Props shared by every clickable skill (chip or core tile).
  const skillProps = (name) => ({
    type: "button",
    "data-skill": name,
    "aria-expanded": active?.name === name,
    "aria-controls": "skill-pop",
    onMouseEnter: (e) => open(name, e.currentTarget),
    onMouseLeave: scheduleClose,
    onFocus: (e) => open(name, e.currentTarget),
    onBlur: scheduleClose,
    onClick: (e) => toggle(name, e.currentTarget),
  });

  const countText = (name) => {
    const n = usage[name]?.length || 0;
    if (byName[name]?.where) return t("skills.everyProject");
    return n === 1 ? t("skills.oneProject") : t("skills.projects", { n });
  };

  let cardIndex = 0;
  const delay = () => ({ "--d": `${cardIndex++ * 90}ms` });

  return (
    <>
      <section className="page-head">
        <span className="tag">{t("skills.tag")}</span>
        <h1>{t("skills.title")}</h1>
        <p className="lead">{t("skills.lead")}</p>
        <p className="legend">
          <span>
            <span className="chip used legend-chip" style={{ "--c": "#3776AB" }}>Python</span> {t("skills.used")}
          </span>
          <span>
            <span className="chip learning legend-chip" style={{ "--c": "#2496ed" }}>Docker</span> {t("skills.learning")}
          </span>
        </p>
      </section>

      <div ref={gridRef} className={`skill-grid${active ? " has-active" : ""}`}>
        <SkillCard className="core" style={delay()} labelledBy="skills-core">
          <div>
            <h2 id="skills-core">
              {t("skills.core")}
              <small>{t("skills.coreLead")}</small>
            </h2>
            <ul className="core-list">
              {coreSkills.map((name, i) => {
                const s = byName[name];
                return (
                  <li key={name} style={{ "--c": s.color, "--i": i }}>
                    <button {...skillProps(name)} className={`skill-btn core-tile${active?.name === name ? " active" : ""}`}>
                      <i aria-hidden="true">{initials(name)}</i>
                      <span>
                        {name}
                        <small>{countText(name)}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <Stack3D small />
        </SkillCard>

        {skillGroups.map((g) => {
          const used = g.items.filter((s) => s.status === "used").length;
          return (
            <SkillCard key={g.key} style={delay()} labelledBy={`skills-${g.key}`}>
              <h2 id={`skills-${g.key}`}>
                {t(`skills.groups.${g.key}`)}
                <small>
                  {used}/{g.items.length}
                </small>
              </h2>
              <ul className="chips">
                {g.items.map((s, i) => (
                  <li key={s.name} style={{ "--i": i }}>
                    <button
                      {...skillProps(s.name)}
                      className={`chip skill-btn ${s.status}${active?.name === s.name ? " active" : ""}`}
                      style={{ "--c": s.color }}
                    >
                      {s.name}
                      <span className="visually-hidden">({t(`skills.${s.status}`)})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </SkillCard>
          );
        })}
      </div>

      {active && (
        <SkillPopover
          skill={byName[active.name]}
          rect={active.rect}
          projects={usage[active.name] || []}
          lang={lang}
          t={t}
          onEnter={cancelClose}
          onLeave={scheduleClose}
        />
      )}
    </>
  );
}

function SkillPopover({ skill, rect, projects, lang, t, onEnter, onLeave }) {
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - 312));
  const style = { left, top: rect.bottom + 8 };
  const links = projects.map((p) => (
    <Link key={p.id} className="pop-project" to={`/projects/${p.id}`}>
      {localized(p, lang).title}
    </Link>
  ));

  let body;
  if (skill.status === "learning") {
    body = (
      <>
        <p>{t("skills.learningNow")}</p>
        {links.length > 0 && (
          <p>
            <span className="muted">{t("skills.firstSteps")}:</span> {links}
          </p>
        )}
      </>
    );
  } else if (links.length) {
    body = <p>{links}</p>;
  } else {
    body = <p>{skill.where?.[lang] || t("skills.noProject")}</p>;
  }

  return (
    <div
      id="skill-pop"
      className="skill-pop"
      role="region"
      aria-label={skill.name}
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      <small>
        {skill.name}
        {skill.status === "used" && links.length > 0 && ` · ${t("skills.usedIn")}`}
      </small>
      {body}
    </div>
  );
}
