# Audit Report: Adaptive Urban Traffic Intelligence Platform

Conducted on: June 16, 2026

## 1. Working Components
- **FastAPI Ingestion Server**: Hosting endpoints correctly on port 8000. CORS configurations permit frontend interactions.
- **SQLite Database Schema**: Automatically created on boot. Holds indices for violations and coordinates.
- **Auto-Seeding Sequence**: Generates 120+ historical violation records with peak hours, coordinates, and mock images on initial startup.
- **Interactive Leaflet Map**: Loads OpenStreetMap imagery dynamically inside Next.js and markers render correctly on coordinates.
- **Recharts Analytics**: Line charts mapping peak traffic volumes and pie charts representing violation categories render correctly.

## 2. Broken & Inefficient Components
- **License Plate OCR Crops**: The cropping code sends the *entire* vehicle bounding box to Tesseract instead of isolating the license plate. This returns blank strings or inaccurate reads, forcing a fallback to deterministic mocks.
- **Simulation Ingestion Endpoint**: *(Fixed)* Previously crashed with `NameError: name 'random' is not defined`.
- **Wrong-side driving, stop-line, and red-light violations**: Mentioned in the design but completely absent from the actual computer vision heuristics in `cv_engine.py`.

## 3. Simulated & Placeholder Elements
- **COCO Model Constraints**: YOLOv8 (pre-trained COCO weights) cannot detect helmets or seatbelts. The system currently checks if a `person` overlaps with a `motorcycle` and assigns a random 45% chance of non-compliance.
- **Parking violations**: Checks if a car/truck coordinates are in the bottom 25% of the frame, representing curbside parking.
- **Mock Coordinates**: Latitude/longitude coordinates are seeded relative to Bangalore traffic centers for demonstration visualization.

## 4. Technical Debt Items
- **UI Typography and Emojis**: Emojis are used directly in text headings and sidebar tabs, creating a non-professional appearance.
- **Visual Calibration Guides**: The annotated frame shows bounding boxes but doesn't overlay "Stop Lines" or "Camera Calibration Polygons" on the frame, making it look like a generic object detector rather than a calibrated municipal traffic tool.
- **PDF Citations**: The platform generates evidence cards as `.jpg` images, but lacks printable, legally-defensible PDF citations.
- **Image Preprocessing**: The system lacks low-light CLAHE, shadow normalization, and denoising preprocessing filters, which are critical for outdoor CCTV systems.

## 5. Required Upgrades
1. Rewrite plate cropping code to crop the lower-center of vehicle bounding boxes.
2. Implement configurable lane directions, stop lines, and signal indicators on annotated frames.
3. Build OpenCV image preprocessing pipelines (CLAHE contrast, gamma correction, rain denoising filters).
4. Integrate `reportlab` to compile print-ready PDF citations.
5. Apply Palantir Gotham design tokens (`#0B1220` backgrounds, `#111827` cards) and replace all text emojis with consistent `lucide-react` icons.
