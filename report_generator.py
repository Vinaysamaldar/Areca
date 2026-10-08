import os
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def _get_styles():
    styles = getSampleStyleSheet()
    
    # Custom Palette
    primary_color = colors.HexColor('#1b5e20')     # Deep Forest Green
    secondary_color = colors.HexColor('#2e7d32')   # Foliage Green
    dark_neutral = colors.HexColor('#1f2937')      # Charcoal Text
    light_bg = colors.HexColor('#f8fafc')          # Off White
    
    # Custom typography
    styles.add(ParagraphStyle(
        name='ReportHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=primary_color,
        alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        name='ReportSubHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4b5563'),
        alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name='BodyJustify',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=dark_neutral,
        alignment=TA_JUSTIFY
    ))
    styles.add(ParagraphStyle(
        name='BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=dark_neutral
    ))
    styles.add(ParagraphStyle(
        name='DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    ))
    return styles

def generate_pdf_report(prediction_data, output_path_or_buffer, disease_info=None):
    """
    Generates a formal diagnostic PDF report using ReportLab.
    
    prediction_data: dict with keys:
      id, filename, image_url, image_path, part, disease, disease_kn, confidence, severity, timestamp
    output_path_or_buffer: filepath or io.BytesIO
    disease_info: dictionary with details for this disease
    """
    doc = SimpleDocTemplate(
        output_path_or_buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = _get_styles()
    story = []
    
    # 1. Header Banner
    story.append(Paragraph("ARECANUT CROP HEALTH DIAGNOSTIC REPORT", styles['ReportHeader']))
    story.append(Paragraph("AI-Assisted Plant Pathology & Horticultural Advisory System", styles['ReportSubHeader']))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1b5e20'), spaceAfter=12))
    
    # 2. Metadata Info Grid
    pred_id = prediction_data.get('id', 'N/A')
    ts = prediction_data.get('timestamp') or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    part_name = (prediction_data.get('part') or 'leaf').capitalize()
    disease_name = prediction_data.get('disease', 'Unknown')
    disease_kn = prediction_data.get('disease_kn', '')
    confidence = float(prediction_data.get('confidence', 0.0))
    severity = prediction_data.get('severity', 'Moderate')
    
    # Color badge for severity
    if severity.lower() in ['none', 'healthy', 'low']:
        sev_color = colors.HexColor('#2e7d32') # Green
    elif severity.lower() in ['mild', 'moderate']:
        sev_color = colors.HexColor('#f57f17') # Amber
    else:
        sev_color = colors.HexColor('#c62828') # Red
    
    meta_data = [
        [
            Paragraph(f"<b>Report ID:</b> ARECA-REC-{pred_id}", styles['Normal']),
            Paragraph(f"<b>Date & Time:</b> {ts}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Inspected Plant Part:</b> {part_name}", styles['Normal']),
            Paragraph(f"<b>Confidence Score:</b> {confidence:.1f}%", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Primary Diagnosis:</b> <b>{disease_name}</b>", styles['Normal']),
            Paragraph(f"<b>Severity Level:</b> <font color='{sev_color.hexval()}'><b>{severity.upper()}</b></font>", styles['Normal'])
        ]
    ]
    
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f8e9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#c5e1a5')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dcedc8')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))
    
    # 3. Visual Evidence & Diagnosis Summary Side-by-Side
    image_element = None
    image_path = prediction_data.get('image_path')
    
    if image_path and os.path.exists(image_path):
        try:
            image_element = RLImage(image_path, width=2.4*inch, height=2.4*inch)
        except Exception:
            image_element = Paragraph("[Scanned Leaf/Nut Image]", styles['BodyBold'])
    else:
        image_element = Paragraph("<i>[Crop sample image recorded on mobile/field device]</i>", styles['Normal'])

    summary_html = f"""
    <b>Diagnostic Classification:</b> {disease_name}<br/>
    {f"<b>ಕನ್ನಡ ಹೆಸರು:</b> {disease_kn}<br/>" if disease_kn else ""}
    <b>Confidence Rating:</b> {confidence:.1f}% (Dual-Stage MobileNetV2)<br/>
    <b>Severity Status:</b> <font color='{sev_color.hexval()}'>{severity}</font><br/><br/>
    <b>Agronomic Summary:</b><br/>
    The automated feature scanner examined anatomical structures of the <b>{part_name.lower()}</b> specimen. 
    Symptoms are characteristic of <b>{disease_name}</b>. Prompt cultural and therapeutic action is advised to safeguard plantation yield.
    """
    
    summary_para = Paragraph(summary_html, styles['BodyJustify'])
    
    vis_table = Table([[image_element, summary_para]], colWidths=[180, 360])
    vis_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ffffff'))
    ]))
    story.append(vis_table)
    story.append(Spacer(1, 14))
    
    # 4. Detailed Clinical & Pathological Insights
    if not disease_info:
        disease_info = {}
    
    symptoms = disease_info.get('symptoms', 'Characteristic chlorosis, necrotic spotting, or rotting observed.')
    cause = disease_info.get('cause', 'Fungal pathogens (e.g. Phytophthora / Ganoderma) or physiological stress.')
    organic_tx = disease_info.get('organic_treatment', 'Apply Trichoderma harzianum enriched FYM around the basin. Ensure adequate drainage.')
    chemical_tx = disease_info.get('chemical_treatment', 'Spray 1% Bordeaux mixture or Copper Oxychloride 0.2% on bunches and crowns.')
    prevention = disease_info.get('prevention', 'Clean plantation floor, destroy fallen diseased nuts, maintain proper drainage channels.')
    expert_advice = disease_info.get('when_to_consult_expert', 'If more than 15% of the plantation shows rapid wilting, rot or yellowing, immediately consult KVK or Horticultural department officers.')
    
    details_data = [
        [
            Paragraph("<b>Identified Symptoms</b>", styles['BodyBold']),
            Paragraph(symptoms, styles['BodyJustify'])
        ],
        [
            Paragraph("<b>Causal Agent & Ecology</b>", styles['BodyBold']),
            Paragraph(cause, styles['BodyJustify'])
        ],
        [
            Paragraph("<b>Bio-Control / Organic</b>", styles['BodyBold']),
            Paragraph(organic_tx, styles['BodyJustify'])
        ],
        [
            Paragraph("<b>Chemical Management</b>", styles['BodyBold']),
            Paragraph(chemical_tx, styles['BodyJustify'])
        ],
        [
            Paragraph("<b>Preventive Measures</b>", styles['BodyBold']),
            Paragraph(prevention, styles['BodyJustify'])
        ],
        [
            Paragraph("<b>Expert Consultation Criteria</b>", styles['BodyBold']),
            Paragraph(expert_advice, styles['BodyJustify'])
        ]
    ]
    
    details_table = Table(details_data, colWidths=[150, 390])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f9fafb')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#d1d5db')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 14))
    
    # 5. Seasonal Spray Advisory Note
    spray_note = """
    <b>Important Safety Note:</b> Follow Central Insecticides Board & Registration Committee (CIBRC) approved dosage rates. 
    Wear protective masks and gloves when mixing chemical fungicides. Avoid spraying during rain showers. 
    Consult your local <b>Krishi Vigyan Kendra (KVK)</b> or Raitha Samparka Kendra for subsidy-backed bio-fungicide formulations.
    """
    safety_table = Table([[Paragraph(spray_note, styles['BodyJustify'])]], colWidths=[540])
    safety_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff9c4')), # Warm yellow alert
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#fbc02d')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(safety_table)
    story.append(Spacer(1, 10))
    
    # 6. Disclaimer & Footer
    disclaimer_text = """
    DISCLAIMER: This diagnostic evaluation was automatically generated by deep learning computer vision models 
    trained on agricultural field datasets. It serves as an assistive preliminary diagnostic tool. 
    Definitive plant pathology confirmation should be conducted through lab culture assays or on-site extension horticulturists.
    """
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#9ca3af'), spaceAfter=6))
    story.append(Paragraph(disclaimer_text, styles['DisclaimerText']))
    
    # Build Document
    doc.build(story)
    return True

def generate_multi_part_pdf_report(scans_list, output_path_or_buffer, plant_id="PLANT-01"):
    """
    Generates a unified Multi-Part Health Report for a single tree/plantation block
    evaluating leaf, stem, root, and nut components together.
    """
    doc = SimpleDocTemplate(
        output_path_or_buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = _get_styles()
    story = []
    
    story.append(Paragraph("ARECANUT COMPREHENSIVE MULTI-PART HEALTH REPORT", styles['ReportHeader']))
    story.append(Paragraph(f"Integrated Palm Health Assessment: ID #{plant_id}", styles['ReportSubHeader']))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1b5e20'), spaceAfter=12))
    
    # Overview Table
    has_severe = any(s.get('severity', '').lower() == 'severe' for s in scans_list)
    has_mild = any(s.get('severity', '').lower() in ['mild', 'moderate'] for s in scans_list)
    
    overall_status = "CRITICAL / ATTENTION NEEDED" if has_severe else ("MILD STRESS DETECTED" if has_mild else "VIGOROUS / HEALTHY")
    status_color = colors.HexColor('#c62828') if has_severe else (colors.HexColor('#f57f17') if has_mild else colors.HexColor('#2e7d32'))
    
    meta_data = [
        [
            Paragraph(f"<b>Assessment ID:</b> {plant_id}", styles['Normal']),
            Paragraph(f"<b>Timestamp:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Parts Inspected:</b> {len(scans_list)} components", styles['Normal']),
            Paragraph(f"<b>Palm Health Status:</b> <font color='{status_color.hexval()}'><b>{overall_status}</b></font>", styles['Normal'])
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e8f5e9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#81c784')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#a5d6a7')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))
    
    story.append(Paragraph("Individual Anatomical Breakdown", styles['SectionHeader']))
    
    # Rows for each scanned part
    part_rows = [
        [
            Paragraph("<b>Part</b>", styles['BodyBold']),
            Paragraph("<b>Diagnosis</b>", styles['BodyBold']),
            Paragraph("<b>Confidence</b>", styles['BodyBold']),
            Paragraph("<b>Severity</b>", styles['BodyBold']),
            Paragraph("<b>Action Required</b>", styles['BodyBold'])
        ]
    ]
    
    for scan in scans_list:
        part_name = (scan.get('part') or 'Unknown').capitalize()
        dis = scan.get('disease', 'Unknown')
        conf = f"{float(scan.get('confidence', 0)):.1f}%"
        sev = scan.get('severity', 'Moderate')
        act = "Routine check" if sev.lower() == 'healthy' else ("Spray bio-agent" if sev.lower() in ['mild', 'low'] else "Immediate fungicide application")
        
        part_rows.append([
            Paragraph(part_name, styles['Normal']),
            Paragraph(dis, styles['Normal']),
            Paragraph(conf, styles['Normal']),
            Paragraph(sev, styles['Normal']),
            Paragraph(act, styles['Normal'])
        ])
        
    parts_table = Table(part_rows, colWidths=[80, 150, 70, 80, 160])
    parts_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(parts_table)
    story.append(Spacer(1, 14))
    
    # Integrated Management Strategy
    story.append(Paragraph("Integrated Management Protocol", styles['SectionHeader']))
    strategy_text = """
    When managing multiple affected parts of the same arecanut palm, root aeration and crown protection must be synchronized:
    <br/>1. <b>Crown & Foliage:</b> Spray 1% Bordeaux mixture or approved copper formulation thoroughly coating leaf sheaths and nut bunches.
    <br/>2. <b>Basin & Root Zone:</b> Drench the soil basin with <i>Trichoderma harzianum</i> (50g mixed with 5kg neem cake and FYM) to halt root grub and basal rot proliferation.
    <br/>3. <b>Drainage:</b> Ensure active inter-row drainage trenches (minimum 50cm depth) to prevent water-logging in the monsoon.
    """
    story.append(Paragraph(strategy_text, styles['BodyJustify']))
    story.append(Spacer(1, 16))
    
    # Disclaimer
    disclaimer_text = """
    DISCLAIMER: AI-generated holistic crop diagnostic summary. Consult the Krishi Vigyan Kendra (KVK) or local horticulture extension officer before administering chemical interventions.
    """
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#9ca3af'), spaceAfter=6))
    story.append(Paragraph(disclaimer_text, styles['DisclaimerText']))
    
    doc.build(story)
    return True
