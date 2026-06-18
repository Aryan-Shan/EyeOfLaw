import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
STATIC_DIR = BASE_DIR / "static"
DB_PATH = BASE_DIR / "traffic_intelligence.db"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# YOLO Configuration
YOLO_MODEL_NAME = "yolov8s.pt"  # Pre-trained COCO model, slightly larger for better accuracy

# Risk Score Weights
VIOLATION_WEIGHTS = {
    "Helmet Non-compliance": 1.5,
    "Triple Riding": 2.0,
    "Seatbelt Non-compliance": 1.0,
    "Illegal Parking": 1.2,
    "Speeding": 1.8
}

# Pre-defined Mock Locations (Bangalore coordinates for traffic tracking)
JUNCTIONS = {
    "Silk Board Junction": {"lat": 12.9176, "lng": 77.6244, "base_risk": 1.8},
    "Hebbal Flyover": {"lat": 13.0359, "lng": 77.5970, "base_risk": 1.5},
    "Marathahalli Bridge": {"lat": 12.9591, "lng": 77.6974, "base_risk": 1.3},
    "Tin Factory Junction": {"lat": 13.0040, "lng": 77.6677, "base_risk": 1.6},
    "Town Hall Junction": {"lat": 12.9649, "lng": 77.5857, "base_risk": 1.2}
}

JUNCTION_CALIBRATION = {
    "Silk Board Junction": {
        "stop_line_y": 320,
        "wrong_side_bbox": [50, 280, 280, 480], # [x1, y1, x2, y2]
        "allowed_dir_y": -1, # Traffic in this wrong_side_bbox should move UP (-1 in pixel coords)
        "traffic_light_state": "Red",
        "traffic_light_bbox": [580, 80, 620, 180],
        "no_parking_bbox": [450, 250, 620, 400]
    },
    "Hebbal Flyover": {
        "stop_line_y": 300,
        "wrong_side_bbox": [300, 240, 450, 480],
        "allowed_dir_y": 1, # Traffic should move DOWN (+1 in pixel coords)
        "traffic_light_state": "Red",
        "traffic_light_bbox": [50, 50, 90, 150],
        "no_parking_bbox": [100, 350, 250, 470]
    },
    "Tin Factory Junction": {
        "stop_line_y": 350,
        "wrong_side_bbox": [100, 260, 280, 450],
        "allowed_dir_y": -1,
        "traffic_light_state": "Red",
        "traffic_light_bbox": [500, 60, 540, 160],
        "no_parking_bbox": [350, 280, 480, 420]
    },
    "Marathahalli Bridge": {
        "stop_line_y": 280,
        "wrong_side_bbox": [80, 220, 220, 400],
        "allowed_dir_y": 1,
        "traffic_light_state": "Red",
        "traffic_light_bbox": [480, 70, 520, 170],
        "no_parking_bbox": [250, 250, 400, 380]
    },
    "Town Hall Junction": {
        "stop_line_y": 330,
        "wrong_side_bbox": [150, 240, 320, 420],
        "allowed_dir_y": -1,
        "traffic_light_state": "Red",
        "traffic_light_bbox": [520, 80, 560, 180],
        "no_parking_bbox": [50, 300, 200, 450]
    }
}


# API Config
HOST = "0.0.0.0"
PORT = 8000
