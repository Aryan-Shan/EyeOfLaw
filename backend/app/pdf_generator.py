import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.barcode import code128
from reportlab.lib.units import inch

def generate_citation_pdf(violation_id, timestamp, location, vehicle_type, plate_number, violation_type, confidence, annotated_img_path, output_pdf_path):
    """Generates an official, print-ready PDF traffic citation card using ReportLab."""
    # Create the document template with 0.5 inch margins
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom Styles (Palantir Gotham/Stripe dark colors mapped to professional print colors)
    primary_color = colors.HexColor("#1E293B") # Slate Navy
    accent_color = colors.HexColor("#F97316") # Orange Accent
    text_color = colors.HexColor("#334155") # Slate-700 Text
    danger_color = colors.HexColor("#EA580C") # Dark Orange/Red Danger
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.white,
        alignment=1 # Centered
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#9CA3AF"),
        alignment=1
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=text_color
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        fontName='Helvetica-Bold',
        textColor=primary_color
    )

    # 1. HEADER SECTION (Official Dark Banner)
    header_data = [
        [
            Paragraph("EYE OF LAW - TRAFFIC ENFORCEMENT AUTHORITY", title_style),
        ],
        [
            Paragraph("AUTOMATED DIGITAL CITATION & E-PROSECUTION CITATION CARD", subtitle_style),
        ]
    ]
    header_table = Table(header_data, colWidths=[7.5 * inch])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    
    # 2. EVIDENCE AND DETAILS SECTION (Side-by-Side Table)
    # Left column: Annotated image
    # Right column: Violation details & verification barcode
    
    # Scale image to fit the column (width: 4.2 inches, height: 3.15 inches)
    img_width = 4.2 * inch
    img_height = 3.15 * inch
    try:
        # Check if the file exists
        if os.path.exists(annotated_img_path):
            evidence_img = Image(annotated_img_path, width=img_width, height=img_height)
        else:
            evidence_img = Paragraph("EVIDENCE FRAMES UNAVAILABLE", label_style)
    except Exception as e:
        evidence_img = Paragraph(f"IMAGE ERROR: {str(e)}", label_style)
        
    # Build details table
    details_data = [
        [Paragraph("CITATION ID:", label_style), Paragraph(f"EOL-TXN-{violation_id:06d}", body_style)],
        [Paragraph("TIMESTAMP:", label_style), Paragraph(timestamp, body_style)],
        [Paragraph("LOCATION:", label_style), Paragraph(location, body_style)],
        [Paragraph("VEHICLE TYPE:", label_style), Paragraph(vehicle_type, body_style)],
        [Paragraph("REG. NUMBER:", label_style), Paragraph(plate_number, ParagraphStyle('Plate', parent=body_style, fontName='Helvetica-Bold', textColor=accent_color))],
        [Paragraph("OFFENSE CHARGE:", label_style), Paragraph(violation_type.upper(), ParagraphStyle('Offense', parent=body_style, fontName='Helvetica-Bold', textColor=danger_color))],
        [Paragraph("CONFIDENCE RATE:", label_style), Paragraph(f"{confidence * 100:.1f}%", body_style)],
        [Paragraph("REVIEW STATUS:", label_style), Paragraph("PENDING OFFICER VERIFICATION", ParagraphStyle('Status', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor("#F59E0B")))]
    ]
    details_table = Table(details_data, colWidths=[1.3 * inch, 1.7 * inch])
    details_table.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    # Combine Image and Details in a split grid
    split_data = [[evidence_img, details_table]]
    split_table = Table(split_data, colWidths=[4.3 * inch, 3.2 * inch])
    split_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(split_table)
    story.append(Spacer(1, 15))
    
    # 3. BARCODE & LEGAL VERIFICATION BLOCK
    # Generate barcode
    barcode_val = f"EOL-{violation_id:06d}-{plate_number.replace('-', '')}"
    barcode = code128.Code128(barcode_val, barHeight=0.4 * inch, barWidth=1.2)
    
    legal_text = (
        "Pursuant to Sections 117 & 119 of the Motor Vehicles Act, this digital record constitutes legal evidence "
        "of the recorded traffic infraction. The registered owner of the vehicle listed above is required to verify "
        "and clear this ticket within 15 calendar days from notice. Automated citation systems are calibrated and "
        "electronically certified by Eye of Law traffic enforcement command hubs."
    )
    
    legal_p = Paragraph(legal_text, ParagraphStyle('Legal', parent=body_style, fontSize=8, leading=10, textColor=colors.HexColor("#6B7280")))
    
    footer_data = [
        [barcode, legal_p]
    ]
    footer_table = Table(footer_data, colWidths=[2.5 * inch, 5.0 * inch])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('LINEABOVE', (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
    ]))
    
    story.append(footer_table)
    
    # Build PDF
    doc.build(story)
    return output_pdf_path
