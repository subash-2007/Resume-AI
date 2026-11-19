import os
from datetime import datetime
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from app.core.config import settings

# Strict brand colors in ReportLab format
COLOR_MOCHA = colors.HexColor("#6F4E37")
COLOR_MOCHA_DARK = colors.HexColor("#2b1e16")
COLOR_SILVER = colors.HexColor("#E5E4E2")
COLOR_LAVENDER = colors.HexColor("#E6E0F0")

def generate_pdf_report(
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    department: str,
    analysis_data: Dict[str, Any],
    output_filename: str
) -> str:
    """Generate a high-end recruitment analysis report using strict brand colors."""
    file_path = os.path.join(settings.REPORT_DIR, output_filename)
    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=COLOR_MOCHA,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        textColor=COLOR_MOCHA_DARK,
        spaceAfter=15
    )
    
    section_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=COLOR_MOCHA,
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=COLOR_MOCHA_DARK
    )
    
    disclaimer_style = ParagraphStyle(
        'DocDisclaimer',
        parent=styles['Italic'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=COLOR_MOCHA
    )
    
    elements = []
    
    # 1. Header Banner
    elements.append(Paragraph("ResumeAI Intelligence Report", title_style))
    elements.append(Paragraph(f"Semantic Evaluation & Hybrid Matching Analysis | Generated on {datetime.utcnow().strftime('%B %d, %Y')}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=COLOR_MOCHA, spaceAfter=15))
    
    # 2. Candidate & Job Metadata Table
    meta_data = [
        [
            Paragraph("<b>Candidate Name:</b>", body_style), Paragraph(candidate_name, body_style),
            Paragraph("<b>Job Opening:</b>", body_style), Paragraph(job_title, body_style)
        ],
        [
            Paragraph("<b>Email Contact:</b>", body_style), Paragraph(candidate_email, body_style),
            Paragraph("<b>Department:</b>", body_style), Paragraph(department, body_style)
        ],
        [
            Paragraph("<b>Evaluation Date:</b>", body_style), Paragraph(datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC'), body_style),
            Paragraph("<b>Overall Match:</b>", body_style), Paragraph(f"<b>{analysis_data.get('overall_score', 0):.1f}%</b>", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[110, 155, 110, 155])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_LAVENDER),
        ('TEXTCOLOR', (0,0), (-1,-1), COLOR_MOCHA_DARK),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 1, COLOR_MOCHA),
        ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_SILVER),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))
    
    # 3. Component Score Breakdown Table
    elements.append(Paragraph("1. Explainable Component Breakdown", section_h1))
    
    score_table_data = [
        ["Evaluation Dimension", "Weight", "Score Achieved", "Status"],
        ["Technical Skills Matching", "35%", f"{analysis_data.get('skill_score', 0):.1f}%", "Evaluated"],
        ["Semantic Contextual Similarity", "25%", f"{analysis_data.get('semantic_score', 0):.1f}%", "Evaluated"],
        ["Verified Professional Experience", "15%", f"{analysis_data.get('experience_score', 0):.1f}%", "Evaluated"],
        ["Educational Requirements Alignment", "10%", f"{analysis_data.get('education_score', 0):.1f}%", "Evaluated"],
        ["Technology & Tooling Alignment", "10%", f"{analysis_data.get('technology_score', 0):.1f}%", "Evaluated"],
        ["Domain & Industry Relevance", "5%", f"{analysis_data.get('domain_score', 0):.1f}%", "Evaluated"],
        ["Composite Match Score", "100%", f"{analysis_data.get('overall_score', 0):.1f}%", "Screening Index"]
    ]
    score_table = Table(score_table_data, colWidths=[200, 70, 110, 150])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_MOCHA),
        ('TEXTCOLOR', (0,0), (-1,0), COLOR_SILVER),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, COLOR_MOCHA),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, COLOR_LAVENDER]),
        ('BACKGROUND', (0,-1), (-1,-1), COLOR_LAVENDER),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 15))
    
    # 4. Skills Analysis
    elements.append(Paragraph("2. Skill Gap & Competency Analysis", section_h1))
    matched_skills = ", ".join(analysis_data.get("matched_skills", [])) or "None detected"
    missing_mand = ", ".join(analysis_data.get("missing_mandatory_skills", [])) or "None (All mandatory skills detected)"
    missing_pref = ", ".join(analysis_data.get("missing_preferred_skills", [])) or "None"
    
    skills_data = [
        [Paragraph("<b>Matched Skills:</b>", body_style), Paragraph(matched_skills, body_style)],
        [Paragraph("<b>Missing Mandatory Skills:</b>", body_style), Paragraph(missing_mand, body_style)],
        [Paragraph("<b>Missing Preferred Skills:</b>", body_style), Paragraph(missing_pref, body_style)]
    ]
    skills_table = Table(skills_data, colWidths=[150, 380])
    skills_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_LAVENDER),
        ('GRID', (0,0), (-1,-1), 0.5, COLOR_SILVER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 1, COLOR_MOCHA)
    ]))
    elements.append(skills_table)
    elements.append(Spacer(1, 15))
    
    # 5. Natural Language Explanation
    elements.append(Paragraph("3. Scoring Explanation & Evidence", section_h1))
    elements.append(Paragraph(analysis_data.get("explanation", "Standard analysis completed."), body_style))
    elements.append(Spacer(1, 15))
    
    # 6. Compliance, Fairness & Methodology
    elements.append(Paragraph("4. Evaluation Methodology & Ethical Compliance", section_h1))
    elements.append(Paragraph(
        "ResumeAI utilizes a hybrid explainable screening algorithm that strictly evaluates objective professional qualifications, competencies, and semantic job alignment. No protected personal attributes (including age, gender, race, ethnicity, or religion) are ingested or factored into matching calculations. Composite scores provide assistance for recruiter triage and must never replace human judgment or automated hiring decisions.",
        disclaimer_style
    ))
    
    doc.build(elements)
    return file_path

