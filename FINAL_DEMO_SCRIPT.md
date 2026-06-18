# Hackathon Pitch Script: Municipal Traffic Intelligence Platform

A guided 3-to-5 minute demonstration timeline designed for the final evaluation round.

---

## 1. Context & Hook (45 Seconds)
* **Visual**: Show the **Intelligence Dashboard** tab ([http://localhost:3000](http://localhost:3000)).
* **Say**: "Good morning judges. Most traffic platforms focus solely on infraction *detection*. We built the **Adaptive Urban Traffic Intelligence & Enforcement Decision Support Platform**—a command hub that helps city transit commissioners decide: *Where should officers be deployed right now, and which junctions carry critical collision risks?*"
* **Point to the screen**: "Here in our dark operations command view, we track Bangalore's primary junctions: Silk Board, Hebbal, and Tin Factory. The geolocated map clusters locations, dynamically colorcoding circles based on localized risk score profiles."

---

## 2. Ingestion & Preprocessing (1.5 Minutes)
* **Action**: Click the **Control Room** tab.
* **Select parameters**: 
  - Sensor Location: **Silk Board Junction**
  - OpenCV Preprocessing: **Toggle ON**
  - Select and upload a traffic sample.
* **Explain the visual columns**:
  - "When a camera frame is ingested, our system runs a modular OpenCV preprocessing pipeline: LAB CLAHE histogram equalization, bilateral noise filters, and a 2D sharpening kernel. On the left, you see the raw camera capture. In the middle is the preprocessed output, showing how low-light shadows and rain artifacts are programmatically mitigated."
  - "This preprocessing layer feeds directly into our YOLOv8 model on the right. Notice the difference: by restoring contrast, vehicle and pedestrian tracking recall rises dramatically."

---

## 3. Theme 3 Calibrated Overlays & OCR (1 Minute)
* **Visual**: Highlight the annotated frame on the right side of the Ingestion page.
* **Say**: "Look at the overlay annotations. We don't just print standard object boxes. The system overlays camera calibration lines: a yellow Stop Line, a purple Wrong-side Radar zone, and a traffic light color detector."
* **Say**: "Because the traffic light is RED, our heuristics track that vehicle {Plate Number} crossing the line, triggering an immediate **Red-light Violation**. If a vehicle moves opposite to the allowed flow inside the radar zone, it triggers a **Wrong-way Intrusion**."
* **OCR accuracy**: "Instead of running OCR on the entire vehicle box, our crop heuristics slice exactly where the plate resides, returning an accurate Karnataka registration reading: **KA-03-JN-4820**."

---

## 4. Legally-defensible PDF Exporter (45 Seconds)
* **Action**: Click **Download PDF Citation**.
* **Show PDF output**: "For every violation, the backend automatically compiles an official municipal citation. This ReportLab-generated PDF includes the citation transaction ID, timestamps, location codes, the crop image proof, a code128 barcode, and legal disclosures. It is print-ready and audit-defensible."

---

## 5. Simulation & Decision Dispatching (45 Seconds)
* **Action**: Click **Simulate Live Video** in the sidebar.
* **Say**: "When a commissioner triggers live simulation, the system ingests 6 concurrent camera node logs. Watch as the KPIs and hourly traffic cycles update. Silk Board's risk score surged because of a 42% spike in helmet infractions during morning rush hours."
* **Action**: Navigate to **Model Evaluation** tab.
* **Say**: "Finally, we maintain a Model Performance center logging average inference latency (114ms), system throughput (8.7 FPS), and standard COCO validation maps. This allows municipal auditors to verify the precision and recall indexes of the network."
* **Say**: "Our platform shifts traffic management from reactive detection to active, predictive city safety command. Thank you, I am ready for your questions."
