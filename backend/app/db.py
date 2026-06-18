import sqlite3
import random
from datetime import datetime, timedelta
import os
from PIL import Image, ImageDraw, ImageFont
from .config import DB_PATH, STATIC_DIR, JUNCTIONS, VIOLATION_WEIGHTS

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create violations table
    cursor.execute("""
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
            status TEXT NOT NULL DEFAULT 'Pending',
            plate_crop_path TEXT
        )
    """)
    
    conn.commit()
    
    # Run a lightweight migration to add the column if the table already existed
    try:
        cursor.execute("ALTER TABLE violations ADD COLUMN plate_crop_path TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        # Column already exists
        pass
    
    # Check if we need to seed
    cursor.execute("SELECT COUNT(*) FROM violations")
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("Database is empty. Seeding with Bangalore traffic violation data...")
        seed_data(conn)
    else:
        print(f"Database already contains {count} records. Skipping seed.")
        
    conn.close()

def create_mock_evidence_image(violation_type, plate_number, filename):
    """Generates a professional mock image showing a bounding box and license plate crop."""
    width, height = 640, 480
    image = Image.new("RGB", (width, height), color=(30, 30, 38))
    draw = ImageDraw.Draw(image)
    
    # Draw simulated lane lines
    draw.line([(100, 480), (250, 150)], fill=(200, 200, 200), width=3)
    draw.line([(540, 480), (390, 150)], fill=(200, 200, 200), width=3)
    draw.line([(320, 480), (320, 150)], fill=(255, 255, 255), width=2, joint="curve")  # dashed center
    
    # Draw a mock bounding box around a vehicle
    box_color = (0, 255, 0) if "Seatbelt" in violation_type else (255, 0, 0)
    # Vehicle box
    draw.rectangle([(180, 180), (460, 400)], outline=box_color, width=4)
    # Label background
    draw.rectangle([(180, 150), (460, 180)], fill=box_color)
    draw.text((190, 155), f"VEHICLE: {violation_type} [CONF: 92%]", fill=(255, 255, 255))
    
    # Draw license plate box
    draw.rectangle([(280, 340), (360, 370)], outline=(0, 0, 255), width=2)
    # Plate label zoom card in the corner
    draw.rectangle([(20, 20), (250, 100)], fill=(15, 15, 20), outline=(100, 100, 150), width=2)
    draw.text((30, 30), "DETECTED LICENSE PLATE", fill=(180, 180, 255))
    draw.text((30, 50), f"REG: {plate_number}", fill=(255, 255, 0))
    draw.text((30, 70), "OCR CONFIDENCE: 94.6%", fill=(0, 255, 0))
    
    # Bottom HUD
    draw.rectangle([(0, 440), (640, 480)], fill=(10, 10, 15))
    draw.text((20, 450), f"CAMERA HUD | SPEED: {random.randint(40, 85)} KM/H | SENSOR ACTIVE", fill=(100, 255, 100))
    
    # Save the file
    filepath = STATIC_DIR / filename
    image.save(filepath)
    return f"static/{filename}"

def seed_data(conn):
    cursor = conn.cursor()
    
    # Helper lists
    vehicle_types = ["Car", "Motorcycle", "Truck", "Bus", "Auto Rickshaw"]
    violation_types = list(VIOLATION_WEIGHTS.keys())
    
    # Severity mapper
    def get_severity(v_type):
        if v_type in ["Triple Riding", "Speeding"]:
            return "High"
        elif v_type in ["Helmet Non-compliance", "Illegal Parking"]:
            return "Medium"
        else:
            return "Low"
            
    # Realistic Plate Numbers for Bangalore (KA)
    plate_pool = [
        "KA-03-JN-4820", "KA-01-AP-8911", "KA-53-GH-1234", "KA-04-XY-9876",
        "KA-51-RR-0077", "KA-03-KT-5544", "KA-01-AA-9999", "KA-51-BC-4321",
        "KA-02-DZ-6543", "KA-53-EQ-8811", "KA-02-LL-2233", "KA-04-TR-7890",
        "KA-03-PL-4532", "KA-05-NK-3344", "KA-51-FF-7654"
    ]
    
    # Create static image assets for seeded data
    os.makedirs(STATIC_DIR, exist_ok=True)
    mock_images = {}
    for v_type in violation_types:
        img_name = f"seed_{v_type.lower().replace(' ', '_').replace('-', '_')}.jpg"
        mock_images[v_type] = create_mock_evidence_image(v_type, "KA-XX-XX-XXXX", img_name)
        
    start_time = datetime.now() - timedelta(days=7)
    
    violations_to_insert = []
    
    for i in range(120):
        # Pick random day and time
        day_offset = random.randint(0, 6)
        hour = random.choice([
            # Morning rush
            8, 8, 9, 9, 10,
            # Afternoon lull
            11, 12, 13, 14, 15, 16,
            # Evening rush
            17, 17, 18, 18, 19, 19,
            # Night
            20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7
        ])
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        timestamp = (start_time + timedelta(days=day_offset)).replace(hour=hour, minute=minute, second=second)
        timestamp_str = timestamp.isoformat()
        
        # Pick location
        loc_name = random.choice(list(JUNCTIONS.keys()))
        loc_info = JUNCTIONS[loc_name]
        
        # Slightly jitter the coordinates to make the map look organic
        lat = loc_info["lat"] + random.uniform(-0.002, 0.002)
        lng = loc_info["lng"] + random.uniform(-0.002, 0.002)
        
        # Pick violation type based on vehicle category
        v_type = random.choice(violation_types)
        if v_type in ["Helmet Non-compliance", "Triple Riding"]:
            veh_type = "Motorcycle"
        elif v_type == "Seatbelt Non-compliance":
            veh_type = random.choice(["Car", "Truck", "Bus"])
        else:
            veh_type = random.choice(vehicle_types)
            
        # Pick plate (some repeat offenders)
        if random.random() < 0.25:
            plate = random.choice(["KA-03-JN-4820", "KA-01-AP-8911", "KA-51-RR-0077"])
        else:
            plate = random.choice(plate_pool)
            
        conf = round(random.uniform(0.78, 0.98), 2)
        sev = get_severity(v_type)
        status = random.choice(["Pending", "Enforced", "Dismissed"])
        
        if v_type == "Speeding" and random.random() < 0.3:
            sev = "High"
            
        img_path = mock_images[v_type]
        
        violations_to_insert.append((
            timestamp_str,
            loc_name,
            lat,
            lng,
            veh_type,
            plate,
            v_type,
            conf,
            sev,
            img_path,
            status
        ))
        
    # Batch insert
    cursor.executemany("""
        INSERT INTO violations (
            timestamp, location, latitude, longitude, vehicle_type, 
            plate_number, violation_type, confidence, severity, image_path, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, violations_to_insert)
    
    conn.commit()
    print(f"Successfully seeded {len(violations_to_insert)} mock Bangalore violation records.")
