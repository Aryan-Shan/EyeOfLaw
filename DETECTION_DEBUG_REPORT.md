# Detection Debugging Report: Non-Guided Ingestion Pipeline

## 1. Identified Root Causes

### 1.1 License Plate OCR Over-cropping
- **Problem**: When a user uploaded an image, the system attempted to run OCR directly on the *entire* vehicle bounding box crop. 
- **Consequence**: Tesseract received massive frames containing headlights, wheels, brand decals, and pavement, resulting in blank character outputs, noise characters, or complete parsing failures.
- **Resolution**: Refined the cropping engine to use vehicle-class sub-box fractions. The engine now slices precisely where plates are mathematically positioned (the bottom 25-30% center for cars/trucks, and the bottom 20% center for motorcycles).

### 1.2 Missing Image Preprocessing
- **Problem**: Raw CCTV frames ingested during nighttime or rainy conditions suffered from low contrast, glare, and sensor noise. YOLOv8 and Tesseract recall dropped.
- **Resolution**: Implemented a toggleable preprocessing engine using OpenCV:
  - Contrast Limited Adaptive Histogram Equalization (CLAHE) on the LAB Luminance channel to boost dark details.
  - Bilateral filters to smooth out noise artifacts while preserving vehicle edges.
  - 2D kernel sharpening filters to counter lens blur.

### 1.3 Absence of Calibration Overlays
- **Problem**: Stop-line, wrong-side driving, and red-light infractions are contextual to physical road geometry, which a generic YOLO detector cannot see without camera calibration.
- **Resolution**: Mapped out `JUNCTION_CALIBRATION` coordinates for each Bangalore junction, drawing calibrated yellow stop lines, wrong-way radar zones, and signal indicators on the annotated frames, turning raw detections into calibrated violations.

### 1.4 Undefined Import Exception
- **Problem**: The simulation stream route `/api/simulate` crashed with a `500 Internal Server Error` due to a missing `import random` statement inside `main.py`.
- **Resolution**: Added the `random` library to imports, and verified that uvicorn routes execute without throwing NameError exceptions.

---

## 2. Debug Verification Logs
Our local testing verified the following successful executions:
- **Reseeding Database**: SQLite table cleared and successfully seeded with Bangalore coordinates.
- **Preprocessing Toggle**: Uploading with `preprocess=True` successfully generates both `preprocessed_upload_*.jpg` and annotated boxes.
- **Infraction Recognition**: Bounding boxes intersect stop-line overlays and trigger stop-line/red-light logs in the database.
- **Simulation Ingestion**: POST requests to `/api/simulate?count=6` return success responses and update charts in real-time.
