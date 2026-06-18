# System Architecture: Adaptive Urban Traffic Intelligence Platform

This document describes the design, components, and data flows of the Adaptive Urban Traffic Intelligence Platform.

## System Block Diagram

```
                   [ Next.js Control Panel UI ]
                               │
               CORS HTTP       ▼       CORS HTTP
              ┌─────────────────────────────────┐
              │                                 │
              ▼                                 ▼
       [ Ingestion API ]             [ Query & Reporting API ]
      (FastAPI Uploads)              (Analytics, Search, PDF)
              │                                 │
              ▼                                 │
   [ Image Preprocessing ]                      │
  (CLAHE, Denoising, Sharpen)                   │
              │                                 │
              ▼                                 │
    [ YOLOv8 Object Detection ]                 │
   (Vehicles, Pedestrians, etc)                 │
              │                                 │
              ▼                                 ▼
   [ Infraction Heuristics ] ───────────> [ SQLite DB ] <─── [ Reports & PDFs ]
 (Wrong-side, Stop-line, Signals)       (traffic_intelligence.db)  (ReportLab Citation)
              │
              ▼
   [ Advanced OCR Pipeline ]
 (Perspective Warp, Otsu, Regex)
```

---

## Technical Stack

1. **Frontend Interface**: Next.js 15 (App Router, React 19, TypeScript), styled with Vanilla Tailwind CSS. Integrates dynamic dashboard widgets (Recharts) and interactive maps (Leaflet map with SSR-disabled wrapper).
2. **Backend Server**: FastAPI (Python 3.12, Uvicorn), structured modularly.
3. **Computer Vision & OCR**:
   * **Object Detection**: YOLOv8 (loaded via `ultralytics` package).
   * **Image Processing**: OpenCV (`opencv-python` with CUDA/CPU thread configuration).
   * **License Plate Recognition**: Tesseract OCR (`pytesseract`), utilizing adaptive perspective warps and RTO registration format regex.
4. **Legally-Defensible Citations**: ReportLab PDF exporter rendering print-ready citations containing Case IDs, barcodes (code128), and cryptographic SHA256 verification hashes.
5. **Database Persistence**: SQLite database (`traffic_intelligence.db`), managing schema seeding, indexing, and paginated keyword queries.

---

## CV Ingestion Pipeline Flow

1. **Image Ingestion**: Media uploaded via `/api/upload` form-data with target junction context and selected OpenCV preprocess mode.
2. **OpenCV Preprocessing**: Adjusts illumination and details based on selectable modes (`Auto`, `Low Light`, `Rain`, `Shadow`, `Motion Blur`) using L-channel LAB CLAHE, bilateral smoothing, and Laplacian sharpening filters.
3. **YOLOv8 Inference**: Identifies and localizes cars, motorcycles, trucks, buses, and pedestrians. Auto-rickshaws are identified by aspect ratios.
4. **Heuristics Evaluation**:
   * **Stop-line Overlaps**: Computes bounding box boundary overlap with the junction's calibrated stop line.
   * **Red-light Violations**: Triggers an infraction if the junction's traffic signal is in a "Red" state and a vehicle crosses the stop line.
   * **Wrong-side Driving**: Examines direction vectors inside calibrated wrong-side zones.
   * **Helmet / Seatbelt / Triple Riding**: Checks occupancy clusters and head ROI boundaries.
5. **OCR & Perspective Warping**: Probable license plate boxes are straightened using contour warping (`cv2.warpPerspective`), binarized with Otsu's method, and passed to Tesseract with PSM 8. Output is cleaned via regex.
6. **Persistence & Exporters**: Record committed to database. JPEG composite evidence cards and certified PDF citations are generated on disk.

---

## SQLite Database Schema

```sql
CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    vehicle_type TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    severity TEXT NOT NULL,
    image_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending'
);

CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations(timestamp);
CREATE INDEX IF NOT EXISTS idx_violations_location ON violations(location);
CREATE INDEX IF NOT EXISTS idx_violations_plate ON violations(plate_number);
```

---

> [!NOTE]
> By separating the computer vision detection layers from the analytics reporting databases, the platform supports real-time execution speeds while maintaining searchable records.
