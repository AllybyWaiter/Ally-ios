# Ally Knowledge Base

> Reference document for the Ally AI assistant. All ranges and thresholds match the app's scoring and alert systems exactly.

---

## Identity

You are **Ally**, an AI aquatics assistant by WA.I.TER. You help users manage aquariums, pools, and spas. You give friendly, concise, science-backed advice. When referencing parameter ranges, always use the values below — they match what the user sees in-app.

---

## Water Body Types

| Category | Types |
|----------|-------|
| Aquarium | `freshwater`, `saltwater`, `reef`, `planted`, `brackish`, `pond` |
| Pool | `pool_chlorine`, `pool_saltwater` |
| Spa | `spa`, `hot_tub` |

---

## Parameter Ranges by Water Body Type

### Freshwater Community

| Parameter | Min | Max | Flag Above | Unit |
|-----------|-----|-----|------------|------|
| pH | 6.0 | 8.5 | — | — |
| Ammonia | 0 | 5.0 | 0.25 | ppm |
| Nitrite | 0 | 5.0 | 0.25 | ppm |
| Nitrate | 0 | 100 | 40 | ppm |
| KH | 1 | 12 | — | dKH |
| GH | 3 | 12 | — | dGH |
| Temperature | 65 | 82 | — | °F |

### Planted Tank

| Parameter | Min | Max | Flag Above | Unit |
|-----------|-----|-----|------------|------|
| pH | 6.0 | 7.5 | — | — |
| Ammonia | 0 | 5.0 | 0.25 | ppm |
| Nitrite | 0 | 5.0 | 0.25 | ppm |
| Nitrate | 5 | 40 | — | ppm |
| KH | 3 | 10 | — | dKH |
| GH | 4 | 12 | — | dGH |
| CO2 | 15 | 35 | — | ppm |
| Temperature | 72 | 80 | — | °F |

### Saltwater (FOWLR)

| Parameter | Min | Max | Flag Above | Unit |
|-----------|-----|-----|------------|------|
| pH | 7.8 | 8.5 | — | — |
| Ammonia | 0 | 5.0 | 0.25 | ppm |
| Nitrite | 0 | 5.0 | 0.25 | ppm |
| Nitrate | 0 | 50 | 20 | ppm |
| Alkalinity | 6.5 | 12 | — | dKH |
| Salinity | 1.023 | 1.026 | — | SG |
| Temperature | 75 | 80 | — | °F |

### Reef

| Parameter | Min | Max | Flag Above | Unit |
|-----------|-----|-----|------------|------|
| pH | 7.8 | 8.5 | — | — |
| Ammonia | 0 | 5.0 | 0.25 | ppm |
| Nitrite | 0 | 5.0 | 0.25 | ppm |
| Nitrate | 0 | 50 | 10 | ppm |
| Alkalinity | 6.5 | 12 | — | dKH |
| Calcium | 350 | 500 | — | ppm |
| Magnesium | 1200 | 1500 | — | ppm |
| Phosphate | 0 | 0.3 | 0.1 | ppm |
| Salinity | 1.023 | 1.026 | — | SG |
| Temperature | 75 | 80 | — | °F |

### Pond

| Parameter | Min | Max | Flag Above | Unit |
|-----------|-----|-----|------------|------|
| pH | 6.5 | 8.5 | — | — |
| Ammonia | 0 | 5.0 | 0.25 | ppm |
| Nitrite | 0 | 5.0 | 0.25 | ppm |
| Nitrate | 0 | 100 | 50 | ppm |
| KH | 3 | 10 | — | dKH |
| GH | 4 | 12 | — | dGH |
| Temperature | 50 | 85 | — | °F |

### Pool (Chlorine)

| Parameter | Min | Max | Unit |
|-----------|-----|-----|------|
| Free Chlorine | 1 | 3 | ppm |
| Total Chlorine | 1 | 5 | ppm |
| pH | 7.2 | 7.8 | — |
| Alkalinity | 80 | 120 | ppm |
| Calcium Hardness | 200 | 400 | ppm |
| Cyanuric Acid | 30 | 50 | ppm |
| Temperature | 78 | 84 | °F |

### Pool (Saltwater)

| Parameter | Min | Max | Unit |
|-----------|-----|-----|------|
| Salt | 2700 | 3400 | ppm |
| Free Chlorine | 1 | 3 | ppm |
| pH | 7.2 | 7.8 | — |
| Alkalinity | 80 | 120 | ppm |
| Calcium Hardness | 200 | 400 | ppm |
| Cyanuric Acid | 70 | 80 | ppm |
| Temperature | 78 | 84 | °F |

### Spa / Hot Tub

| Parameter | Min | Max | Unit |
|-----------|-----|-----|------|
| Free Chlorine | 3 | 5 | ppm |
| Bromine | 4 | 6 | ppm |
| pH | 7.2 | 7.8 | — |
| Alkalinity | 80 | 120 | ppm |
| Calcium Hardness | 150 | 250 | ppm |
| Temperature | 100 | 104 | °F |

---

## Alert Thresholds (Trend Analysis)

These define when the app triggers **warning** vs **critical** alerts:

### Freshwater
| Parameter | Warning Min | Warning Max | Critical Min | Critical Max |
|-----------|------------|------------|-------------|-------------|
| pH | 6.5 | 7.5 | 6.0 | 8.0 |
| Ammonia | 0 | 0.25 | — | 0.5 |
| Nitrite | 0 | 0.25 | — | 0.5 |
| Nitrate | 0 | 40 | — | 80 |
| Temperature | 72 | 82 | 65 | 90 |

### Reef
| Parameter | Warning Min | Warning Max | Critical Min | Critical Max |
|-----------|------------|------------|-------------|-------------|
| pH | 8.1 | 8.4 | 7.8 | 8.6 |
| Ammonia | 0 | 0.05 | — | 0.1 |
| Nitrite | 0 | 0.05 | — | 0.1 |
| Nitrate | 0 | 10 | — | 20 |
| Calcium | 400 | 450 | 380 | 480 |
| Alkalinity | 8 | 11 | 7 | 13 |
| Phosphate | 0 | 0.03 | — | 0.1 |
| Salinity | 1.024 | 1.026 | 1.022 | 1.028 |

### Pool
| Parameter | Warning Min | Warning Max | Critical Min | Critical Max |
|-----------|------------|------------|-------------|-------------|
| Free Chlorine | 1 | 3 | 0.5 | 5 |
| pH | 7.2 | 7.6 | 7.0 | 7.8 |
| Alkalinity | 80 | 120 | 60 | 180 |
| CYA | 30 | 50 | — | 100 |
| Calcium Hardness | 200 | 400 | 150 | 500 |

### Spa
| Parameter | Warning Min | Warning Max | Critical Min | Critical Max |
|-----------|------------|------------|-------------|-------------|
| Free Chlorine | 3 | 5 | 1 | 10 |
| Bromine | 4 | 6 | 2 | 10 |
| pH | 7.2 | 7.6 | 7.0 | 7.8 |
| Temperature | 100 | 104 | — | 106 |

---

## Health Score System

**Formula:** `score = (water × 0.40) + (livestock × 0.25) + (maintenance × 0.20) + (consistency × 0.15)`

### Water Test Component (40%)
- No tests ever logged → 30
- Recency: ≤3 days = 100, ≤7 days = 90, ≤14 days = 75, >14 days = 50
- Parameter status: good = 100, warning = 50, critical = 0
- Combined: `(recency × 0.4) + (parameterAvg × 0.6)`

### Livestock Component (25%)
- healthy = 100, quarantine = 70, stressed = 50, sick = 25, deceased = 0
- Weighted by quantity per animal, averaged
- No livestock → 100

### Maintenance Component (20%)
- No tasks → 80
- `completionRate - min(overdueCount × 15, 60)`

### Consistency Component (15%)
- Testing frequency (last 30 days): ≥8 tests = 100, ≥4 = 85, ≥2 = 70, ≥1 = 55, 0 = 50
- Task completion: `min(100, completedTasks × 10 + 50)`
- Combined: `(testingFreq × 0.6) + (taskCompletion × 0.4)`

### Labels

| Score | Label | Color |
|-------|-------|-------|
| ≥ 90 | Excellent | Green |
| ≥ 75 | Good | Light Green |
| ≥ 50 | Fair | Yellow |
| ≥ 25 | Needs Attention | Orange |
| < 25 | Critical | Red |

### Notification Triggers
- Score < 50 → push notification sent
- Score < 25 → severity = critical
- Score 25–49 → severity = warning
- Deduplicated: one notification per severity per 24 hours

---

## Safe Dosing Guidelines

### Aquarium
| Action | Dosage | Notes |
|--------|--------|-------|
| Water change | 25% weekly (community), 10–15% weekly (reef) | Temp-match new water within 2°F |
| Ammonia emergency | 50% water change immediately, dose dechlorinator | Repeat if still >1 ppm |
| pH too low | Add 1 tsp baking soda per 5 gal to raise ~0.5 dKH | Raise no more than 0.2 pH per day |
| pH too high | Add 1 mL pH-down per 10 gal | Never adjust more than 0.3 per day |
| Nitrate reduction | 25–50% water change | Add fast-growing plants for ongoing control |
| Salt (freshwater disease treatment) | 1 tbsp per 5 gal | Only for freshwater — never reef/planted |

### Pool
| Action | Dosage | Notes |
|--------|--------|-------|
| Shock treatment | 1 lb calcium hypochlorite per 10,000 gal | Run pump, test after 8 hrs |
| Raise free chlorine 1 ppm | 2 oz liquid chlorine per 10,000 gal | — |
| Raise pH 0.2 | 6 oz soda ash per 10,000 gal | — |
| Lower pH 0.2 | 12 oz muriatic acid per 10,000 gal | Add to deep end with pump running |
| Raise alkalinity 10 ppm | 1.5 lb baking soda per 10,000 gal | — |
| Raise calcium 10 ppm | 1.25 lb calcium chloride per 10,000 gal | Dissolve in bucket first |

### Spa
| Action | Dosage | Notes |
|--------|--------|-------|
| Drain and refill | Every 3–4 months | Or when TDS > 1500 ppm |
| Shock after heavy use | 1 oz non-chlorine shock per 250 gal | Wait 15 min before re-entry |

---

## Emergency Protocols

### Ammonia Spike (Aquarium)
1. Test to confirm level
2. Immediately do 50% water change (temp-matched, dechlorinated)
3. Dose Seachem Prime or equivalent ammonia detoxifier
4. Stop feeding for 24–48 hours
5. Check filter is running — clean gently if clogged (never replace all media at once)
6. Retest in 4 hours; repeat water change if >0.5 ppm
7. Resume feeding lightly once ammonia reads 0

### pH Crash (Aquarium)
1. Do NOT adjust pH directly — adjust KH/alkalinity first
2. Do a 25% water change with properly buffered water
3. Add baking soda slowly: 1 tsp per 5 gal
4. Never raise pH more than 0.2 per day — rapid shifts kill fish faster than wrong pH
5. Identify cause: low KH, CO2 overdose, driftwood leaching

### Zero Free Chlorine in Occupied Pool
1. Keep swimmers out until chlorine is restored
2. Add liquid chlorine to reach 3 ppm (use calc above)
3. Run pump on high for 1 hour
4. Test and readjust
5. If CYA > 80, chlorine may be "locked" — partial drain + refill to lower CYA

### Power Outage (Aquarium)
- **Oxygen**: Critical after 2–4 hours in stocked tank. Battery-powered air pump is first priority.
- **Temperature**: Drops ~1–2°F per hour depending on room temp. Wrap tank in towels/blankets. Critical below 65°F (tropical).
- **Filter**: Beneficial bacteria begin dying after 4–6 hours without flow. Do NOT restart a filter that sat idle >6 hrs without rinsing media — dead bacteria will spike ammonia.

---

## Maintenance Schedule Defaults

### Aquarium
- **Water change**: Weekly, 25%
- **Water testing**: Weekly (more often during cycling or issues)
- **Filter media rinse**: Monthly (in old tank water, never tap)
- **Gravel vacuum**: With each water change
- **Equipment check**: Monthly

### Pool
- **Test water**: 2–3 times per week
- **Shock**: Weekly (1 lb per 10,000 gal)
- **Skimmer baskets**: Weekly
- **Backwash filter**: When pressure reads 8–10 PSI above clean baseline
- **Salt cell cleaning**: Every 3 months (salt pools)

### Spa
- **Test sanitizer**: Before each use
- **Shock**: After heavy use or weekly
- **Filter clean**: Monthly
- **Drain and refill**: Every 3–4 months
- **Cover conditioning**: Monthly

---

## Weather-Adjusted Advice

| Condition | Advice |
|-----------|--------|
| UV Index ≥ 8 | Chlorine consumption 2–3x normal — test sanitizer daily |
| UV Index 6–7 | Increase sanitizer testing frequency |
| Temp ≥ 90°F | Increase shock frequency, watch for algae |
| Temp < 50°F | Check heater efficiency, reduce feeding (pond) |
| Wind ≥ 15 mph | Clean skimmer baskets more often |
| Rain incoming | Plan to test and adjust pH after — rain lowers pH |
| Humidity ≥ 80% | Slower evaporation affects chemistry concentration |

---

## Trend Detection Logic

The app flags trends when:
- **Rising/Falling**: Parameter moves in same direction for ≥ n-1 of n recent readings AND total change > 10%
- **Unstable**: Coefficient of variation > 30% across recent readings
- **Approaching threshold**: Value within 20% of range boundary
- **Warning margin**: 20% of the parameter's total range from the boundary
