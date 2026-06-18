# Judge Ingestion Demo Walkthrough

This document guides you through executing the automated **Judge Demo Mode** sequence designed for final evaluations.

---

## The Automated "Run Complete Scenario" Script

The system includes a single-click orchestration script that executes all Theme 3 ingestion steps, runs YOLO and OCR pipelines, compiles certified citations, and updates the decision support dashboard in under 5 seconds.

### Step 1: Initialize Ingestion
* **Action**: Locate the prominent blue **Run Judge Demo Mode** button at the bottom of the Left Sidebar panel.
* **Action**: Click the button to launch the automated scenario.

### Step 2: Observe the 8-Stage Progress Modal
A dark overlay modal will appear, executing the following pipeline checks sequentially:
1. `Ingesting raw traffic sensor feed...` (Copies a mock Bangalore junction stream snapshot)
2. `Applying CLAHE & bilateral preprocessing layers...` (Enhances low-light and rainy artifacts)
3. `Running YOLOv8 vehicle & road user classification...` (Localizes cars, bikes, and pedestrians)
4. `Detecting stop-line & wrong-side violations...` (Checks calibration overlays and intersections)
5. `Running cropped license plate perspective warp & OCR...` (Corrects skew and formats text)
6. `Compiling official ReportLab PDF prosecution ticket...` (Creates a certified citation on disk)
7. `Registering evidence hash SHA-256 to database...` (Secures record integrity in SQLite)
8. `Finalizing dashboard state & generating AI recommendations...` (Re-calculates junction risk indices)

### Step 3: Review the Legally-Defensible Citation Dossier
* **Observation**: The progress modal will close, the system automatically redirects you to the **Control Room (Upload)** tab, and pops open the **E-Citation Evidence Dossier** card view.
* **Details**: Review the side-by-side enforcement card containing:
  * Official case number (`TXN-XXXXXX`)
  * Annotated image highlighting the infraction area (e.g., stop line intrusion or wrong-side arrow)
  * Clean formatted license plate (e.g. `KA-03-JN-4820`)
  * Barcode barcode128 and confidence scoring index.
* **Action**: Click **Download JPEG** or close the dossier.

### Step 4: Examine the Preprocessing Before/After Slider
* **Action**: Under the Control Room visualizer output, locate the view mode selector.
* **Action**: Toggle from **Inspection Grid** to **Before/After Slider**.
* **Action**: Slide the vertical pointer left and right across the frame.
* **Details**: Observe how the CLAHE contrast correction boosts visibility in low-light shadows and bilateral filters smooth out noise.

### Step 5: Query the Searchable Records Tab
* **Action**: Navigate to the **Searchable Records** tab in the Sidebar.
* **Action**: Search for the plate number identified on the citation (or select the junction name under **Sensor Location** filter).
* **Details**: Verify that the table matches the database log, displaying paginated infraction rows with quick links to download the certified PDF or inspect the image evidence.

### Step 6: Verify Model Performance Log
* **Action**: Open the **Model Evaluation** tab.
* **Details**: Review the precision, recall, and end-to-end processing latencies read directly from the SQLite metadata matrices and `benchmark_results.json`.
