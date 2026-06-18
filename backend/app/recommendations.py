import sqlite3
from datetime import datetime, timedelta
from .config import DB_PATH, JUNCTIONS
from .db import get_db_connection

def generate_recommendations():
    """Analyzes recent violation logs and returns natural language decision-support recommendations."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    recommendations = []
    rec_id = 1
    
    now = datetime.now()
    one_week_ago = (now - timedelta(days=7)).isoformat()
    
    # -------------------------------------------------------------
    # RULE 1: Helmet Violations Spike Check
    # -------------------------------------------------------------
    for loc_name in JUNCTIONS.keys():
        # Helmet violations in last 7 days at this location
        cursor.execute("""
            SELECT COUNT(*) FROM violations 
            WHERE location = ? AND violation_type = 'Helmet Non-compliance' AND timestamp >= ?
        """, (loc_name, one_week_ago))
        recent_helmet = cursor.fetchone()[0]
        
        # Helmet violations in prior week
        two_weeks_ago = (now - timedelta(days=14)).isoformat()
        cursor.execute("""
            SELECT COUNT(*) FROM violations 
            WHERE location = ? AND violation_type = 'Helmet Non-compliance' 
            AND timestamp >= ? AND timestamp < ?
        """, (loc_name, two_weeks_ago, one_week_ago))
        prior_helmet = cursor.fetchone()[0]
        
        if recent_helmet > 8:
            pct_inc = 0
            if prior_helmet > 0:
                pct_inc = int(((recent_helmet - prior_helmet) / prior_helmet) * 100)
            else:
                pct_inc = recent_helmet * 10 # approximate increase
                
            priority = "Critical" if recent_helmet > 15 else "High"
            
            # Find peak hours for helmet violations at this junction
            cursor.execute("""
                SELECT STRFTIME('%H', timestamp) as hr, COUNT(*) as cnt
                FROM violations 
                WHERE location = ? AND violation_type = 'Helmet Non-compliance'
                GROUP BY hr ORDER BY cnt DESC LIMIT 1
            """, (loc_name,))
            row = cursor.fetchone()
            peak_hour_str = "08:00 AM - 10:00 AM"
            if row:
                pk_hr = int(row["hr"])
                peak_hour_str = f"{pk_hr:02d}:00 - {pk_hr+2:02d}:00"
                # Format to AM/PM
                hr_ampm = lambda h: f"{h if h <= 12 else h-12:02d} {'AM' if h < 12 else 'PM'}"
                peak_hour_str = f"{hr_ampm(pk_hr)} - {hr_ampm((pk_hr+2)%24)}"
                
            recommendations.append({
                "id": rec_id,
                "title": f"Deploy Helmet Enforcement: {loc_name.split(' (')[0]}",
                "location": loc_name,
                "priority": priority,
                "action": f"Deploy 2 enforcement officers to conduct manual check points.",
                "trigger": f"Helmet non-compliance violations increased by {pct_inc}% this week (total: {recent_helmet} incidents).",
                "timestamp": now.isoformat(),
                "status": "Active"
            })
            rec_id += 1

    # -------------------------------------------------------------
    # RULE 2: Illegal Parking and Towing patrol Check
    # -------------------------------------------------------------
    for loc_name in JUNCTIONS.keys():
        cursor.execute("""
            SELECT COUNT(*) FROM violations 
            WHERE location = ? AND violation_type = 'Illegal Parking' AND timestamp >= ?
        """, (loc_name, one_week_ago))
        parking_count = cursor.fetchone()[0]
        
        if parking_count > 6:
            recommendations.append({
                "id": rec_id,
                "title": f"Targeted Towing Patrol: {loc_name.split(' (')[0]}",
                "location": loc_name,
                "priority": "Medium" if parking_count < 12 else "High",
                "action": "Dispatch towing patrols for hourly sweeps to clear arterial lanes.",
                "trigger": f"Illegal curbside parking is causing localized lane blockages with {parking_count} violations logged.",
                "timestamp": now.isoformat(),
                "status": "Active"
            })
            rec_id += 1

    # -------------------------------------------------------------
    # RULE 3: Speeding / Interceptor Deployment Check
    # -------------------------------------------------------------
    for loc_name in JUNCTIONS.keys():
        cursor.execute("""
            SELECT COUNT(*) FROM violations 
            WHERE location = ? AND violation_type = 'Speeding' AND timestamp >= ?
        """, (loc_name, one_week_ago))
        speeding_count = cursor.fetchone()[0]
        
        if speeding_count > 8:
            recommendations.append({
                "id": rec_id,
                "title": f"Deploy Speed Interceptor: {loc_name.split(' (')[0]}",
                "location": loc_name,
                "priority": "High" if speeding_count < 15 else "Critical",
                "action": "Deploy radar-equipped speed interceptor vehicle to slow down incoming traffic.",
                "trigger": f"High-severity speeding violations detected on arterial lanes (Total: {speeding_count} over speed limit).",
                "timestamp": now.isoformat(),
                "status": "Active"
            })
            rec_id += 1

    # -------------------------------------------------------------
    # RULE 4: Repeat Offender Watchlist and Interception Flag
    # -------------------------------------------------------------
    cursor.execute("""
        SELECT plate_number, COUNT(*) as cnt 
        FROM violations 
        GROUP BY plate_number HAVING cnt >= 4 
        ORDER BY cnt DESC LIMIT 3
    """)
    repeaters = cursor.fetchall()
    for row in repeaters:
        plate = row["plate_number"]
        cnt = row["cnt"]
        
        # Get most recent location for this repeater
        cursor.execute("""
            SELECT location FROM violations 
            WHERE plate_number = ? 
            ORDER BY timestamp DESC LIMIT 1
        """, (plate,))
        last_loc = cursor.fetchone()["location"]
        
        recommendations.append({
            "id": rec_id,
            "title": f"Flag Repeat Offender: {plate}",
            "location": last_loc,
            "priority": "Critical",
            "action": f"Flag vehicle {plate} in Automatic License Plate Recognition (ALPR) system for active officer intercept.",
            "trigger": f"Vehicle has accumulated {cnt} separate traffic violations. Last seen at {last_loc}.",
            "timestamp": now.isoformat(),
            "status": "Active"
        })
        rec_id += 1

    # -------------------------------------------------------------
    # Default recommendations if data is low
    # -------------------------------------------------------------
    if len(recommendations) == 0:
        recommendations.append({
            "id": rec_id,
            "title": "Establish Static Monitoring",
            "location": "Silk Board Junction",
            "priority": "Low",
            "action": "Maintain routine automated camera monitoring.",
            "trigger": "Traffic patterns are stable within acceptable risk boundaries.",
            "timestamp": now.isoformat(),
            "status": "Active"
        })
        
    conn.close()
    
    # Sort by priority order: Critical -> High -> Medium -> Low
    priority_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 4))
    
    return recommendations
