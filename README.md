# 🐦 Unstable Flappy  

### *A System That Breaks Itself*

 
***Unstable Flappy*** is a browser-based game inspired by *Flappy Bird*, reimagined as a living system that **destabilizes over time**.  
The longer you survive, the less the game can be trusted.


🔗 **Live Demo:** https://flappy-bird-new.lovable.app 

---

## 🎯 Core Idea

Most games get harder by increasing numbers.

**Unstable Flappy gets harder by breaking rules.**

- Gravity shifts.
- Controls invert.
- Pipes begin to oscillate.
- The system freezes.
- The music degrades.

Nothing changes randomly — every collapse is **structured, timed, and emergent**.

---

## ⚙️ Technical Stack

- **TypeScript**
- **React (Functional Components)**
- **HTML5 Canvas**
- **Web Audio API**
- No external game engines

Architecture is modular and phase-driven.

---

## 🎮 Core Gameplay

- Classic Flappy-style survival loop
- Tap / Click / Space to flap
- Pass pipes to score
- Progress through **phases**, each introducing new instability

> The player is not fighting the bird, they are fighting the **system itself**.

###  ⚠️During **Control Flip** phases:
- HOLD input pushes the bird **down**
- RELEASE lets it float **up**
  
---

## 🔢 Phase System


| Phase | Feature                      | Description                                                                              |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| 1     | Stable System                | Normal gravity, calm ambient audio, clean visuals                                        |
| 2     | Gravity Drift                | Slight random fluctuation in gravity, horizontal wind added, minor physics inconsistency |
| 3     | Oscillation                  | Pipes start vertical oscillation, subtle audio wobble                                    |
| 4     | Wind Force                   | Horizontal wind intensifies, bird movement slightly unpredictable                        |
| 5     | Control Flip                 | Input logic temporarily inverts, visual distortion increases, audio slightly unstable    |
| 6     | Ghost Pipes                  | Invisible pipes appear, stronger visual glitches                                         |
| 7     | Speed Drift                  | Game speed subtly fluctuates, control timing becomes unreliable                          |
| 8     | Visual Glitch                | Aggressive visual distortions, physics behave unpredictably, audio heavily modulated     |
| 9     | Total Chaos                  | Final **SYSTEM OVERLOAD**, maximum visual/audio breakdown, system near total collapse    |


---

## 🧪 Game Modes

### 🔥 Chaos Mode (Default)
- Full instability
- All collapse events enabled
- Intended experience

### 🧊 Demo Mode
- Wider pipe gaps
- Softer physics
- Reduced audio intensity
- Designed for showcasing later phases

Toggle anytime.

---

## 🛠️ Instability Mechanics

| Mechanic            | Description                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Feedback Loops**  | Survival increases phase → Phase increases instability → Instability makes survival harder → Success accelerates failure         |
| **Adaptive Rules**  | Gravity shifts, control logic flips in later phases, wind changes direction & strength, game rules evolve without player consent |
| **Entropy Visuals** | Pipe oscillation grows stronger, screen wobble & desaturation, glitch flickers at high phases                                    |
| **Collapse Events** | **System Overload** every 3 phases, brief game freeze, physics/movement halt, audio cuts & recovers, system visibly “reboots”    |


---
# 👩‍💻
- Hackathon: **System Collapse Hackathon 2026**.
- Team Name: Sableye
- Name: Vaibhavi Srivastava
- Github: [archangel2006](https://github.com/archangel2006/)


