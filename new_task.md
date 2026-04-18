Act as a senior product designer and mobile UX architect. Be brutally honest.

You are reviewing a healthcare app (Sanjivani) which is supposed to be a **Personal Health OS**, not just a reminder app. The current UI looks visually clean but functionally weak, shallow, and not aligned with the seriousness of the problem (drug interactions, elderly safety, emergency response).

Your task is to **critique and redesign the UI at a system level**, not just styling.

---

### Critical Issues (You MUST address these)

1. **No Information Hierarchy**

* Everything looks equally important
* No distinction between:

  * safe state
  * risk state
  * critical alerts

---

2. **Feels like a demo app, not a real system**

* UI shows cards, but no intelligence
* No sense of:

  * urgency
  * risk
  * system thinking

---

3. **Home screen is useless**

* Shows progress but no actionable insight
* Empty states dominate the experience
* No “what should I do now?” clarity

---

4. **Medication UX is shallow**

* No visible:

  * timeline
  * adherence behavior
  * interaction warnings
* Looks like static data, not a dynamic system

---

5. **Vitals screen looks good but disconnected**

* Feels like a separate app/module
* No link to:

  * medications
  * anomaly detection
  * alerts

---

6. **Health Resume is static**

* Looks like a profile page
* Not like a “live medical intelligence layer”

---

7. **Scanner UX is weak**

* No confidence indicator
* No feedback loop
* No “AI is working” feeling

---

8. **Map screen is generic**

* Looks like any maps app
* No healthcare intelligence:

  * no triage
  * no prioritization
  * no emergency context

---

9. **No system-wide state awareness**
   The app does NOT answer:

* Am I safe right now?
* Did I miss something important?
* Is something wrong with my body?

---

### What you must redesign

---

## 1. Global UX Philosophy

Transform UI from:
→ “feature screens”

to:
→ “state-driven health system”

Every screen must reflect:

* SAFE (green)
* WARNING (amber)
* CRITICAL (red)

---

## 2. Home Screen (Rebuild completely)

Must include:

### Top:

* System status:

  * “All systems stable”
  * OR “⚠ 1 interaction risk detected”
  * OR “Missed 2 doses”

---

### Middle:

* Medication timeline (visual, not empty box)
* Show:

  * upcoming doses
  * missed doses
  * taken doses

---

### Alerts Section:

* Highest priority
* Show:

  * interaction warnings
  * abnormal vitals
  * missed medication

---

### Insight Card:

* Example:

  * “You started Metformin 2 days ago”
  * “No adverse reaction detected yet”

---

## 3. Medications Screen

Add:

* visual stack of medications
* interaction graph (even basic)
* adherence score
* last taken time

---

## 4. Vitals Screen

Integrate with:

* medication timeline
* show:

  * “HR spike after last dose”
* anomaly flags MUST be visible

---

## 5. Health Resume

Make it:

* structured + dynamic
* highlight:

  * critical allergies
  * active meds
* not just cards → make it “doctor-ready snapshot”

---

## 6. Scanner

Improve:

* add scanning feedback:

  * “Detecting text…”
  * confidence %
* highlight detected fields live

---

## 7. Map Screen

Add intelligence:

* nearest hospital WITH:

  * wait time
  * specialty
  * emergency relevance
* not just location pins

---

## 8. Visual System Fixes

* Reduce flat UI → add depth via hierarchy
* Use:

  * elevation
  * contrast
  * spacing
* Colors must communicate state, not aesthetics

---

## 9. Empty States (major problem)

Replace:
“No data”

With:

* guidance
* CTA
* system suggestions

---

## Output Required

1. Redesigned screen hierarchy
2. Component-level layout changes
3. State-driven UI logic (important)
4. What to REMOVE (be strict)
5. What to ADD (based on product vision)

---

### Final Instruction

Do NOT beautify the UI.

Make it:

* intelligent
* actionable
* system-driven

This app should feel like:
→ “a system that protects life”

Not:
→ “a health tracking app”
