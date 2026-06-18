import sqlite3
from datetime import datetime, timedelta
from .config import DB_PATH, JUNCTIONS, VIOLATION_WEIGHTS
from .db import get_db_connection

def calculate_trend_multiplier(cursor, location, avg_daily_count):
    """Calculates trend multiplier based on the last 24 hours vs historical average."""
    now = datetime.now()
    one_day_ago = (now - timedelta(days=1)).isoformat()
    
    cursor.execute("""
        SELECT COUNT(*) FROM violations 
        WHERE location = ? AND timestamp >= ?
    """, (location, one_day_ago))
    last_24h_count = cursor.fetchone()[0]
    
    if avg_daily_count == 0:
        return 1.0, "stable"
        
    ratio = last_24h_count / avg_daily_count
    
    if ratio > 1.2:
        # Increase risk by up to 50% if recent activity is high
        multiplier = round(min(1.5, 1.0 + (ratio - 1.2) * 0.5), 2)
        return multiplier, "increasing"
    elif ratio < 0.8:
        return 0.85, "decreasing"
    else:
        return 1.0, "stable"

def get_analytics_overview():
    """Aggregates database records to build the main dashboard view statistics."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. KPIs
    # Total violations
    cursor.execute("SELECT COUNT(*) FROM violations")
    total_violations = cursor.fetchone()[0]
    
    # Total from last week (for delta calculation)
    one_week_ago = (datetime.now() - timedelta(days=7)).isoformat()
    cursor.execute("SELECT COUNT(*) FROM violations WHERE timestamp >= ?", (one_week_ago,))
    recent_violations = cursor.fetchone()[0]
    older_violations = total_violations - recent_violations
    
    # Calculate percentage change
    if older_violations > 0:
        pct_change = ((recent_violations - older_violations) / older_violations) * 100
        pct_str = f"{pct_change:+.1f}%"
        kpi_type = "negative" if pct_change > 0 else "positive" # violations increasing is bad ('negative')
    else:
        pct_str = "+100%"
        kpi_type = "neutral"
        
    # Repeat offenders (plates with >= 3 violations)
    cursor.execute("""
        SELECT COUNT(*) FROM (
            SELECT plate_number FROM violations 
            GROUP BY plate_number HAVING COUNT(*) >= 3
        )
    """)
    repeat_offenders = cursor.fetchone()[0]
    
    # Analyze hotspots and count high-risk zones
    hotspots = get_hotspots_list(cursor)
    high_risk_zones = sum(1 for h in hotspots if h["risk_score"] > 35)
    
    # Active Hotspot (the highest score junction)
    active_hotspot = hotspots[0]["location"] if hotspots else "None"
    
    kpis = {
        "total_violations": {
            "title": "Total Violations",
            "value": f"{total_violations}",
            "change": f"{pct_str} vs last week",
            "type": kpi_type
        },
        "high_risk_zones": {
            "title": "High Risk Zones",
            "value": f"{high_risk_zones}",
            "change": "Risk threshold > 35",
            "type": "negative" if high_risk_zones > 0 else "positive"
        },
        "active_hotspots": {
            "title": "Primary Hotspot",
            "value": active_hotspot.split(" (")[0],
            "change": f"Score: {hotspots[0]['risk_score']:.1f}" if hotspots else "N/A",
            "type": "neutral"
        },
        "repeat_offenders": {
            "title": "Repeat Offenders",
            "value": f"{repeat_offenders}",
            "change": "Plates with >= 3 offenses",
            "type": "negative" if repeat_offenders > 0 else "positive"
        }
    }
    
    # 2. Violation distribution (Pie Chart)
    cursor.execute("""
        SELECT violation_type, COUNT(*) as count 
        FROM violations GROUP BY violation_type
    """)
    distribution = [{"name": row["violation_type"], "value": row["count"]} for row in cursor.fetchall()]
    
    # 3. Hourly Trends (Line Chart)
    cursor.execute("""
        SELECT STRFTIME('%H', timestamp) as hour, COUNT(*) as count 
        FROM violations GROUP BY hour ORDER BY hour
    """)
    hourly_trends = []
    # Fill standard 24 hours
    hourly_db = {int(row["hour"]): row["count"] for row in cursor.fetchall()}
    for h in range(24):
        hourly_trends.append({
            "hour": f"{h:02d}:00",
            "violations": hourly_db.get(h, 0)
        })
        
    # 4. Weekly Trends (Daily Count)
    # Group by date of last 7 days
    weekly_trends = []
    for i in range(7):
        day = datetime.now() - timedelta(days=6-i)
        day_str = day.strftime("%Y-%m-%d")
        day_label = day.strftime("%a") # e.g. Mon
        
        cursor.execute("""
            SELECT COUNT(*) FROM violations 
            WHERE timestamp LIKE ?
        """, (f"{day_str}%",))
        count = cursor.fetchone()[0]
        
        weekly_trends.append({
            "day": day_label,
            "violations": count
        })
        
    conn.close()
    
    return {
        "kpis": kpis,
        "violation_distribution": distribution,
        "hourly_trends": hourly_trends,
        "weekly_trends": weekly_trends
    }

def get_hotspots_list(cursor=None):
    """Calculates risk ranking and scoring details for each location."""
    should_close = False
    if cursor is None:
        conn = get_db_connection()
        cursor = conn.cursor()
        should_close = True
        
    hotspots = []
    
    for loc_name, loc_info in JUNCTIONS.items():
        # Get count per violation type for this location
        cursor.execute("""
            SELECT violation_type, COUNT(*) as count 
            FROM violations WHERE location = ?
            GROUP BY violation_type
        """, (loc_name,))
        
        type_counts = {row["violation_type"]: row["count"] for row in cursor.fetchall()}
        total_count = sum(type_counts.values())
        
        # Calculate base risk score based on violation counts and severity weights
        weighted_score = 0.0
        for v_type, weight in VIOLATION_WEIGHTS.items():
            count = type_counts.get(v_type, 0)
            weighted_score += count * weight
            
        # Incorporate historical average daily count
        cursor.execute("SELECT MIN(timestamp), MAX(timestamp) FROM violations")
        min_t, max_t = cursor.fetchone()
        
        days_span = 7.0
        if min_t and max_t:
            try:
                t1 = datetime.fromisoformat(min_t)
                t2 = datetime.fromisoformat(max_t)
                days_span = max(1.0, (t2 - t1).days + 1.0)
            except:
                pass
                
        avg_daily_count = total_count / days_span
        
        # Calculate Trend Multiplier (last 24 hours vs average daily count)
        multiplier, trend_status = calculate_trend_multiplier(cursor, loc_name, avg_daily_count)
        
        # Final risk score formula
        risk_score = round(weighted_score * loc_info["base_risk"] * multiplier, 1)
        
        # Generate simple recommendation outline
        rec = "Status Nominal. Maintain standard automated monitoring."
        if risk_score > 45:
            # High risk
            primary_v_type = max(type_counts, key=type_counts.get) if type_counts else "General"
            rec = f"Critical Risk! Deploy active enforcement patrol and prioritize {primary_v_type} enforcement."
        elif risk_score > 25:
            # Medium risk
            rec = "Moderate Risk. Schedule high-frequency automated CCTV sweep patrols."
            
        hotspots.append({
            "location": loc_name,
            "latitude": loc_info["lat"],
            "longitude": loc_info["lng"],
            "risk_score": risk_score,
            "count": total_count,
            "trend": trend_status,
            "recommendation": rec
        })
        
    # Sort hotspots by risk score descending
    hotspots.sort(key=lambda x: x["risk_score"], reverse=True)
    
    if should_close:
        cursor.connection.close()
        
    return hotspots
