# Joint Health Index (JHI) - Mathematical Formulation & Physics Derivation

## 1. Domain Background & Holm Contact Theory

In electrical switchgear and distribution panels, bolted busbar joints do not conduct electricity across their entire geometric overlap area. Due to microscopic surface roughness, true physical metal-to-metal contact occurs solely at microscopic surface asperities known as **a-spots**.

### Holm's Constriction Resistance
According to Ragnar Holm's fundamental contact theory, electrical current flow lines constrict sharply to pass through these minute a-spots, creating **constriction resistance** ($R_c$):

$$R_c = \frac{\rho}{2 \sum a_i}$$

Where:
- $\rho$: Specific electrical resistivity of high-conductivity electrolytic copper ($1.68 \times 10^{-8} \ \Omega\cdot\text{m}$).
- $\sum a_i$: Sum of the radii of all conducting contact a-spots.

When a mechanical clamping force $F$ is applied by the M10 high-tensile bolt:

$$\sum \pi a_i^2 = \frac{F}{\xi \cdot H}$$

Where $H$ is the Meyer hardness of copper and $\xi$ is an asperity contact distribution factor ($0.3 \le \xi \le 0.7$). Consequently, constriction resistance is inversely proportional to the square root of clamping force:

$$R_c \propto \frac{\rho}{\sqrt{F}}$$

### Failure Mechanics
When bolt tension relaxes over time (due to vibration, thermal cycling creep, or Belleville washer degradation), $F$ decreases, collapsing the true contact area $\sum a_i$. This triggers a positive-feedback degradation loop:
1. Contact resistance $R_{joint}$ spikes.
2. Joule heating ($P = I^2 R$) accelerates.
3. Elevated temperatures promote copper oxidation ($2\text{Cu} + \text{O}_2 \to 2\text{CuO}$), forming insulating oxide films at remaining contact points.
4. Thermal expansion cycling causes fretting corrosion and surface pitting, ultimately leading to catastrophic flashover or thermal runaway.

---

## 2. Derived Electrical & Thermal Properties

### 2.1 Contact Resistance ($R_{joint}$)
Given the joint voltage drop $V_{drop}$ in millivolts ($\text{mV}$) and current $I$ in amperes ($\text{A}$):

$$R_{joint} = \frac{V_{drop} \times 10^{-3} \text{ V}}{I \text{ A}} = \frac{V_{drop}}{I} \text{ m}\Omega$$

#### Near-Zero Current Guard:
In unpowered or lightly loaded busbars ($I < I_{threshold}$, default $1.0\text{ A}$), ADC noise, thermoelectric Seebeck voltages, and op-amp offset voltages dominate microvolt measurements. Computing $\frac{V_{drop}}{I}$ with $I \to 0$ causes asymptotic explosion, generating severe false alarms.
$$\text{If } I < 1.0\text{ A}: \quad R_{joint} = \text{undefined} \implies \text{UI renders: "Insufficient current (I < 1.0 A)"}$$

### 2.2 Joint Power Loss ($P_{loss}$)
The rate of electrical energy converted into Joulean heat at the joint interface:

$$P_{loss} = \frac{V_{drop}(\text{mV}) \times I(\text{A})}{1000} = I^2 \times R_{joint}(\Omega) \quad [\text{Watts}]$$

### 2.3 Temperature Rise ($\Delta T$)
Thermal gradient between the joint interface and the busbar enclosure ambient atmosphere:

$$\Delta T = T_{joint} - T_{ambient} \quad [^\circ\text{C}]$$

---

## 3. Joint Health Index (JHI) Formulation

The overall Joint Health Index $JHI \in [0, 100]$ provides a normalized, deterministic score of physical joint integrity:

$$JHI = w_R \cdot S_R + w_T \cdot S_T + w_F \cdot S_F + w_P \cdot S_P$$

Subject to the constraint:
$$\sum_{i} w_i = w_R + w_T + w_F + w_P = 1.00$$

### Default Factor Weights:
- $w_R = 0.35$: Contact Resistance Sub-index ($S_R$)
- $w_T = 0.30$: Temperature Rise Sub-index ($S_T$)
- $w_F = 0.25$: Bolt Clamping Force Sub-index ($S_F$)
- $w_P = 0.10$: Power Loss Dissipation Sub-index ($S_P$)

---

## 4. Sub-Index Normalization Equations

Each physical parameter is normalized onto a linear $0 \to 100$ score based on factory baselines and IEEE/IEC critical safety thresholds:

### 4.1 Resistance Score ($S_R$)
Let $R_0$ be baseline resistance ($0.040\text{ m}\Omega$) and $R_{crit}$ be critical degradation limit ($0.095\text{ m}\Omega$):

$$S_R = \begin{cases}
100, & \text{if } R_{joint} \le R_0 \text{ or } I < I_{threshold} \\
0, & \text{if } R_{joint} \ge R_{crit} \\
100 \times \left(1 - \frac{R_{joint} - R_0}{R_{crit} - R_0}\right), & \text{otherwise}
\end{cases}$$

### 4.2 Thermal Rise Score ($S_T$)
Let $\Delta T_0$ be nominal temperature rise ($8.0^\circ\text{C}$) and $\Delta T_{crit}$ be critical gradient ($45.0^\circ\text{C}$):

$$S_T = \begin{cases}
100, & \text{if } \Delta T \le \Delta T_0 \\
0, & \text{if } \Delta T \ge \Delta T_{crit} \\
100 \times \left(1 - \frac{\Delta T - \Delta T_0}{\Delta T_{crit} - \Delta T_0}\right), & \text{otherwise}
\end{cases}$$

### 4.3 Clamping Force Score ($S_F$)
Let $F_0$ be target initial clamping force ($12,000\text{ N}$) and $F_{crit}$ be critical loosening threshold ($5,000\text{ N}$):

$$S_F = \begin{cases}
100, & \text{if } F \ge F_0 \\
0, & \text{if } F \le F_{crit} \\
100 \times \left(\frac{F - F_{crit}}{F_0 - F_{crit}}\right), & \text{otherwise}
\end{cases}$$

### 4.4 Power Loss Score ($S_P$)
Let $P_0$ be nominal power loss ($1.6\text{ W}$) and $P_{crit}$ be maximum continuous allowable dissipation ($10.0\text{ W}$):

$$S_P = \begin{cases}
100, & \text{if } P_{loss} \le P_0 \\
0, & \text{if } P_{loss} \ge P_{crit} \\
100 \times \left(1 - \frac{P_{loss} - P_0}{P_{crit} - P_0}\right), & \text{otherwise}
\end{cases}$$

---

## 5. Status Classification Boundaries

| JHI Score Range | Status Code | UI Color Token | Classification | Prescriptive Action |
|---|---|---|---|---|
| **$80 \le JHI \le 100$** | `HEALTHY` | Emerald Green | Optimal Joint Health | Continue routine supervisory monitoring. |
| **$50 \le JHI < 80$** | `WARNING` | Amber Gold | Moderate Degradation | Schedule inspection during next planned maintenance outage. |
| **$0 \le JHI < 50$** | `CRITICAL` | Crimson Red | Severe Degradation | Immediate inspection required; risk of hot-spot or flashover. |

---

## 6. Non-RUL Scope Clarification

In compliance with IEEE 1459 and industrial switchgear reliability practices, this system **deliberately refrains from providing synthetic Remaining Useful Life (RUL) countdowns**. 

Busbar joints do not degrade along a monotonic, deterministic timeline. Failure timing depends on non-deterministic external variables:
- Stochastic load cycling and motor starting inrush currents.
- Atmospheric humidity and corrosive industrial airborne contaminants ($H_2S, SO_2$).
- Upstream and downstream fault-induced electromagnetic shock forces ($F_{EM} \propto I_{fault}^2$).

Instead of unverified RUL estimations, Smart Joint Monitor provides:
1. Real-time condition-based degradation velocity ($dJHI / dt$).
2. Root-cause fault mode classification (mechanical loosening vs interfacial oxidation).
3. Prescriptive, prioritized field intervention recommendations.
