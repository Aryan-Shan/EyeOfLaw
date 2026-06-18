# Hackathon Presentation Demo Script: Adaptive Urban Traffic Intelligence Platform

Use this script as a guided walkthrough for your 3-to-5 minute live hackathon pitch.

---

## 1. The Hook (First 45 seconds)

* **Say**: "Good morning judges. Almost every team in this track will show you a system that detects a traffic violation—a helmet infraction here, a seatbelt issue there. But detection is just a data-collection layer. We asked ourselves: *Once you detect 10,000 violations in a city, what does the Traffic Commissioner actually do with that information? Where do they send their officers? Which junctions are becoming high-risk right now?*"
* **Say**: "We built the **Adaptive Urban Traffic Intelligence Platform**. It’s not just a detector; it's a decision-support command system for city transit authorities."

---

## 2. Navigating the Executive Dashboard (1.5 Minutes)

* **Action**: Share your screen showing the **Intelligence Dashboard** tab ([http://localhost:3000](http://localhost:3000)).
* **Point out the KPIs**: "At first glance, a Commissioner sees the total violation volume, the count of active high-risk zones, our primary hot zone location, and the number of repeat offenders—all computed in real-time."
* **Point out the Maps & Charts**: 
  - "Here on our live geolocated map, we overlay OpenStreetMap with CartoDB dark tiling. The circular heat zones indicate localized collision risk. Clicking a hotspot doesn't just show counts; it details the specific traffic trend and recommendations."
  - "Below the map, our charts track peak violation hours—showing major spikes during morning and evening rush hours—and break down the distribution of offenses."

---

## 3. The Live Upload & Computer Vision Ingestion (1.5 Minutes)

* **Action**: Click the **Control Room** tab.
* **Explain the CV Pipeline**: "Our system ingests traffic CCTV images and video streams. We use a modular **YOLOv8** engine to track cars, trucks, motorcycles, and pedestrians. We overlay custom heuristics checking for overlapping riders (for Triple Riding) and helmet presence."
* **Run a Demo**:
  1. Check **Guided Demo Mode** (this runs our deterministic demo cases with high-fidelity coordinate graphics).
  2. Select **Helmet Non-compliance** in the dropdown.
  3. Drag in a sample image.
  4. Click **Execute Violation Detection**.
* **Show the output**:
  - "In seconds, the system localizes the motorcycle (in green) and the rider (in red), flagging the specific head region as 'NO HELMET'. It also runs OCR to read the license plate: **{Plate Number}**."
  - "More importantly, look at the right panel. It generates an official **Municipal E-Citation Evidence Dossier**. Click **View Evidence Card**. This combines the annotated visual proof, timestamp, location, and a unique transaction barcode into a single downloadable JPEG citation. This is legally-compliant, audit-ready prosecution evidence."

---

## 4. Decision Support & Recommendations (1 Minute)

* **Action**: Click the **Location Risk Rankings** tab.
* **Say**: "Here is the heart of the platform. We rank junctions by risk using a custom formula that weighs the severity of offenses (e.g., Triple Riding carries a higher weight than Seatbelts) multiplied by a surge factor if violations spike in the last 24 hours."
* **Action**: Click the **AI Recommendations** tab.
* **Say**: "Finally, we translate risk data into natural-language commands. Look at this bulletin board. The platform alerts us: *Helmet violations at Silk Board increased by 35% in morning peak hours*. Instead of just showing a graph, it prints an actionable task: *Deploy 2 static officers for compliance checks at Silk Board between 08:00 AM and 10:00 AM*."
* **Say**: "A commissioner can click **Approve Command** or **Deploy Patrol** to dispatch units instantly."

---

## 5. The Closing Pitch (15 seconds)

* **Say**: "By treating computer vision as a data pipeline and prioritizing decision-support intelligence, we've built a scalable urban safety command center ready for smart city integration. Thank you, I am open to your questions."
