# Detection Validation Report: Object Detection & Road User Classification

This report validates the computer vision detection layers and heuristics built into the Adaptive Urban Traffic Intelligence Platform. It details the classification results for vehicles and road users under real urban traffic environments.

## Object Detection Class Matrix

The system tracks all primary municipal road user categories using YOLOv8 bounding boxes combined with geometric ratio filters to categorize local anomalies like Auto-rickshaws.

| Class Label | Model Source | Detection Metric | Bounding Box Logic | Sample Classification Output |
| :--- | :--- | :--- | :--- | :--- |
| **Car** | YOLOv8 COCO | Conf > 0.82 | Standard centroid coordinates | `{"box": [120, 240, 310, 400], "class": "car", "score": 0.91}` |
| **Motorcycle** | YOLOv8 COCO | Conf > 0.80 | Tail light / seat markers | `{"box": [220, 180, 420, 420], "class": "motorcycle", "score": 0.88}` |
| **Truck** | YOLOv8 COCO | Conf > 0.85 | Aspect ratio height checks | `{"box": [10, 150, 250, 410], "class": "truck", "score": 0.87}` |
| **Bus** | YOLOv8 COCO | Conf > 0.87 | Large rectangular markers | `{"box": [45, 120, 350, 480], "class": "bus", "score": 0.89}` |
| **Auto-rickshaw** | Custom BBox Ratio | Conf > 0.80 | BBox ratio `0.9 <= w/h <= 1.2` (compact box) | `{"box": [160, 200, 310, 320], "class": "auto_rickshaw", "score": 0.84}` |
| **Pedestrian** | YOLOv8 COCO | Conf > 0.70 | Vertical aspect ratio boxes | `{"box": [270, 120, 350, 320], "class": "person", "score": 0.76}` |
| **Rider** | Geometric Intersection | Conf > 0.75 | BBox IoU overlap with motorcycle > 0.05 | `{"box": [200, 120, 270, 320], "class": "rider", "score": 0.82}` |
| **Driver** | Occupant ROI | Conf > 0.70 | Car windshield top quadrant | `{"box": [220, 150, 310, 260], "class": "driver", "score": 0.81}` |

## Core Infraction Calibration Profiles

The heuristics match coordinates mapped on Bangalore junctions (Silk Board, Hebbal, Tin Factory, etc.) to capture complex infractions:

### 1. Wrong-Side Driving Heuristic
* **RADAR zone bounds**: `[wx1, wy1, wx2, wy2]` matching direction parameters.
* **Violation trigger**: Trajectory angle difference `|allowed_y - motion_y| > threshold` or location in opposite direction zones.
* **Output**: Red bounding box with trajectory vector arrow overlay.

### 2. Stop-Line Intrusion
* **Zone bounds**: Calibrated horizontal stop line at `stop_line_y`.
* **Violation trigger**: Vehicle bottom bounds `y2 > stop_line_y` and `y1 < stop_line_y + 30`.
* **Output**: Bounding box intersection markers highlighting stop line overlapping areas in red.

### 3. Red-Light Violation
* **Trigger condition**: Active Red signal state intersection overlay (`signal == "Red"`) AND vehicle crosses stop line (`y2 > stop_line_y + 40`).
* **Output**: Traffic signal box with Red light circle overlay and vector tracking arrows.

---

## Sample Validation Logs

```json
[
  {
    "violation_type": "Stop-line Violation",
    "vehicle_type": "Car",
    "plate_number": "KA-03-JN-4820",
    "confidence": 0.92,
    "severity": "Medium"
  },
  {
    "violation_type": "Red-light Violation",
    "vehicle_type": "Motorcycle",
    "plate_number": "KA-04-TX-8911",
    "confidence": 0.94,
    "severity": "High"
  },
  {
    "violation_type": "Wrong-side Driving",
    "vehicle_type": "Car",
    "plate_number": "KA-53-GH-1234",
    "confidence": 0.89,
    "severity": "Medium"
  }
]
```

> [!TIP]
> The calibration zones can be dynamically updated inside `config.py` depending on the installation angle of the road side camera node.
