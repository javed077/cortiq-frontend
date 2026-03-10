# ── ADD THESE IMPORTS to your existing imports in main.py ──────────────────────
# from fastapi.responses import StreamingResponse
# from reportlab.lib.pagesizes import A4
# from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# from reportlab.lib.units import mm
# from reportlab.lib import colors
# from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
# from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
# import io
# ───────────────────────────────────────────────────────────────────────────────
#
# pip install reportlab


from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import io
from datetime import date


# ── colour palette ─────────────────────────────────────────────────────────────

BG        = colors.HexColor("#0A0A0A")
ACCENT_C  = colors.HexColor("#C8FF00")
DIM_WHITE = colors.HexColor("#CCCCCC")
MID_WHITE = colors.HexColor("#888888")
RED_C     = colors.HexColor("#FF4444")
YELLOW_C  = colors.HexColor("#FFB800")
CYAN_C    = colors.HexColor("#00E5FF")
CARD_BG   = colors.HexColor("#141414")
BORDER    = colors.HexColor("#222222")


# ── styles ─────────────────────────────────────────────────────────────────────

def make_styles():
    base = getSampleStyleSheet()

    heading = ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=28,
                              textColor=colors.white, spaceAfter=4, leading=32)

    accent_head = ParagraphStyle("AccentH1", fontName="Helvetica-Bold", fontSize=28,
                                  textColor=ACCENT_C, leading=32)

    label = ParagraphStyle("Label", fontName="Helvetica", fontSize=7,
                            textColor=MID_WHITE, spaceAfter=2, leading=10,
                            wordWrap="LTR")

    body = ParagraphStyle("Body", fontName="Helvetica", fontSize=9,
                           textColor=DIM_WHITE, leading=15, spaceAfter=0)

    bold_body = ParagraphStyle("BoldBody", fontName="Helvetica-Bold", fontSize=9,
                                textColor=colors.white, leading=14)

    section_title = ParagraphStyle("SectionTitle", fontName="Helvetica-Bold",
                                    fontSize=7, textColor=MID_WHITE,
                                    spaceAfter=10, charSpacing=2, leading=10)

    big_num = ParagraphStyle("BigNum", fontName="Helvetica-Bold", fontSize=36,
                              textColor=ACCENT_C, leading=40, spaceAfter=0)

    tag = ParagraphStyle("Tag", fontName="Helvetica", fontSize=7,
                          textColor=ACCENT_C, leading=9)

    return dict(heading=heading, accent_head=accent_head, label=label,
                body=body, bold_body=bold_body, section_title=section_title,
                big_num=big_num, tag=tag)


# ── helper: section divider ────────────────────────────────────────────────────

def section_gap(story, space=8):
    story.append(Spacer(1, space * mm))


def section_label(story, text, styles):
    story.append(Paragraph(text.upper(), styles["section_title"]))


# ── helper: card table ────────────────────────────────────────────────────────

def card_table(data, col_widths, story):
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [CARD_BG]),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t)


# ── /export-pdf ────────────────────────────────────────────────────────────────

@app.post("/export-pdf")
def export_pdf(payload: dict):
    result         = payload.get("result", {})
    form           = payload.get("form", {})
    strategy       = payload.get("strategy", [])
    market_research= payload.get("marketResearch", {})
    investor_score = payload.get("investorScore", {})

    buf  = io.BytesIO()
    W, H = A4
    M    = 18 * mm   # margin

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=M, rightMargin=M,
        topMargin=M,  bottomMargin=M,
        title="Cortiq Startup Analysis",
        author="Cortiq AI",
    )

    S     = make_styles()
    story = []
    CW    = W - 2 * M   # content width

    # ── COVER ──────────────────────────────────────────────────────────────────

    # dark header block via table
    idea  = (form.get("idea") or "Startup")[:55]
    cover = Table([[
        Paragraph(f"{idea}<br/><font color='#C8FF00'>Analysis Report</font>",
                  ParagraphStyle("CoverTitle", fontName="Helvetica-Bold",
                                 fontSize=22, textColor=colors.white, leading=28)),
        Paragraph(str(result.get("health_score", "—")),
                  ParagraphStyle("BigScore", fontName="Helvetica-Bold",
                                 fontSize=52, textColor=ACCENT_C, leading=56, alignment=TA_RIGHT)),
    ]], colWidths=[CW * 0.72, CW * 0.28])
    cover.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#0D1A00")),
        ("TOPPADDING",    (0, 0), (-1, -1), 20),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
        ("LEFTPADDING",   (0, 0), (-1, -1), 16),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW",     (0, 0), (-1, -1), 1, ACCENT_C),
    ]))
    story.append(cover)

    # meta line
    meta_parts = []
    if form.get("customer"):  meta_parts.append(f"Target: {form['customer']}")
    if form.get("geography"): meta_parts.append(form["geography"])
    meta_parts.append(f"Generated {date.today().strftime('%B %d, %Y')}")
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("  ·  ".join(meta_parts),
                             ParagraphStyle("Meta", fontName="Helvetica", fontSize=7,
                                            textColor=MID_WHITE, leading=10)))
    section_gap(story, 6)

    # ── KEY METRICS ROW ────────────────────────────────────────────────────────

    section_label(story, "Key Metrics", S)

    success_prob = round(
        result.get("market_health", 0)      * 0.30 +
        result.get("execution_health", 0)   * 0.25 +
        result.get("finance_health", 0)     * 0.20 +
        result.get("growth_health", 0)      * 0.15 +
        result.get("competition_health", 0) * 0.10
    )
    runway = result.get("runway_months", 0)
    runway_color = ACCENT_C if runway > 18 else (YELLOW_C if runway > 9 else RED_C)
    inv_score = investor_score.get("investor_score", "—") if investor_score else "—"

    def metric_cell(label, value, color=colors.white):
        return [
            Paragraph(label.upper(), ParagraphStyle("ML", fontName="Helvetica", fontSize=6, textColor=MID_WHITE, leading=8, spaceAfter=4)),
            Paragraph(str(value), ParagraphStyle("MV", fontName="Helvetica-Bold", fontSize=22, textColor=color, leading=26)),
        ]

    metrics_data = [[
        metric_cell("Success Prob.", f"{success_prob}%",     ACCENT_C),
        metric_cell("Runway",        f"{runway}mo",          runway_color),
        metric_cell("Risk Index",    result.get("risk_score","—"),
                    RED_C if (result.get("risk_score",0) or 0) > 60 else YELLOW_C),
        metric_cell("Investor Score",inv_score,              CYAN_C),
    ]]

    # flatten: each cell is a list of two Paragraphs → stack in a nested table
    flat_cells = []
    for cell in metrics_data[0]:
        inner = Table([[c] for c in cell], colWidths=[CW / 4 - 8])
        inner.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
                                    ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0)]))
        flat_cells.append(inner)

    metrics_table = Table([flat_cells], colWidths=[CW / 4] * 4)
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID",     (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(metrics_table)
    section_gap(story, 5)

    # ── HEALTH BREAKDOWN ──────────────────────────────────────────────────────

    section_label(story, "Health Breakdown", S)

    health_items = [
        ("Market",      result.get("market_health",0),      "#00E5FF"),
        ("Execution",   result.get("execution_health",0),   "#C8FF00"),
        ("Finance",     result.get("finance_health",0),     "#FFB800"),
        ("Growth",      result.get("growth_health",0),      "#A855F7"),
        ("Competition", result.get("competition_health",0), "#FF6B6B"),
    ]

    health_rows = []
    for label, val, hex_c in health_items:
        bar_pct = val / 100
        # simulate bar with a two-column table
        bar = Table(
            [[""]],
            colWidths=[CW * 0.45 * bar_pct],
            rowHeights=[5],
        )
        bar.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor(hex_c)),
            ("TOPPADDING",  (0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
            ("LEFTPADDING", (0,0),(-1,-1),0), ("RIGHTPADDING", (0,0),(-1,-1),0),
        ]))
        health_rows.append([
            Paragraph(label, ParagraphStyle("HL", fontName="Helvetica", fontSize=8, textColor=DIM_WHITE, leading=10)),
            bar,
            Paragraph(str(val), ParagraphStyle("HV", fontName="Helvetica-Bold", fontSize=8,
                                                textColor=colors.HexColor(hex_c), leading=10, alignment=TA_RIGHT)),
        ])

    health_table = Table(health_rows, colWidths=[55, CW * 0.45, 30])
    health_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
        ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS",(0, 0), (-1, -1), [CARD_BG, colors.HexColor("#111111")]),
    ]))
    story.append(health_table)
    section_gap(story, 5)

    # ── INSIGHT + RISK ────────────────────────────────────────────────────────

    section_label(story, "Intelligence Summary", S)

    two_col = Table([[
        Paragraph(f"<b><font color='#C8FF00'>KEY INSIGHT</font></b><br/><br/>{result.get('insight','')}",
                  ParagraphStyle("IC", fontName="Helvetica", fontSize=8, textColor=DIM_WHITE,
                                 leading=13, spaceAfter=0)),
        Paragraph(f"<b><font color='#FF6B6B'>CRITICAL RISK</font></b><br/><br/>{result.get('biggest_problem','')}",
                  ParagraphStyle("RC", fontName="Helvetica", fontSize=8, textColor=DIM_WHITE,
                                 leading=13, spaceAfter=0)),
    ]], colWidths=[CW / 2 - 4, CW / 2 - 4])
    two_col.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, 0), colors.HexColor("#0D1A00")),
        ("BACKGROUND",    (1, 0), (1, 0), colors.HexColor("#1A0000")),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("BOX",           (0, 0), (0, 0), 0.5, colors.HexColor("#2A4A00")),
        ("BOX",           (1, 0), (1, 0), 0.5, colors.HexColor("#4A1A1A")),
    ]))
    story.append(two_col)
    section_gap(story, 5)

    # ── IMPROVEMENTS ──────────────────────────────────────────────────────────

    if result.get("improvements"):
        section_label(story, "Recommended Improvements", S)
        imps = result["improvements"]
        imp_rows = [[
            Paragraph(str(i + 1), ParagraphStyle("INum", fontName="Helvetica-Bold", fontSize=8,
                                                   textColor=ACCENT_C, leading=12)),
            Paragraph(imp, ParagraphStyle("IText", fontName="Helvetica", fontSize=8,
                                           textColor=DIM_WHITE, leading=13)),
        ] for i, imp in enumerate(imps)]
        imp_table = Table(imp_rows, colWidths=[18, CW - 18])
        imp_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
            ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
            ("ROWBACKGROUNDS",(0, 0), (-1, -1), [CARD_BG, colors.HexColor("#111111")]),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 12),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(imp_table)
        section_gap(story, 5)

    # ── STRATEGY ──────────────────────────────────────────────────────────────

    if strategy:
        section_label(story, "Strategic Recommendations", S)
        strat_rows = [[
            Paragraph("→", ParagraphStyle("Arrow", fontName="Helvetica-Bold", fontSize=9,
                                           textColor=ACCENT_C, leading=12)),
            Paragraph(s, ParagraphStyle("SText", fontName="Helvetica", fontSize=8,
                                         textColor=DIM_WHITE, leading=13)),
        ] for s in strategy]
        strat_table = Table(strat_rows, colWidths=[14, CW - 14])
        strat_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
            ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
            ("ROWBACKGROUNDS",(0, 0), (-1, -1), [CARD_BG, colors.HexColor("#111111")]),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 12),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(strat_table)
        section_gap(story, 5)

    # ── MARKET DATA ───────────────────────────────────────────────────────────

    if market_research:
        section_label(story, "Market Research", S)
        comps = "  ·  ".join(market_research.get("competitors") or []) or "—"
        mkt_data = [[
            [Paragraph("MARKET SIZE", S["label"]),
             Paragraph(str(market_research.get("market_size","—")),
                       ParagraphStyle("MktV", fontName="Helvetica-Bold", fontSize=14,
                                      textColor=ACCENT_C, leading=18))],
            [Paragraph("GROWTH RATE", S["label"]),
             Paragraph(str(market_research.get("growth_rate","—")),
                       ParagraphStyle("GrV", fontName="Helvetica-Bold", fontSize=14,
                                      textColor=colors.white, leading=18))],
            [Paragraph("COMPETITORS", S["label"]),
             Paragraph(comps, ParagraphStyle("CompV", fontName="Helvetica", fontSize=8,
                                              textColor=DIM_WHITE, leading=12))],
        ]]

        flat_mkt = []
        for cell_items in mkt_data[0]:
            inner = Table([[ci] for ci in cell_items], colWidths=[CW / 3 - 8])
            inner.setStyle(TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),3),
                                        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
            flat_mkt.append(inner)

        mkt_table = Table([flat_mkt], colWidths=[CW / 3] * 3)
        mkt_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
            ("BOX",           (0, 0), (-1, -1), 0.5, BORDER),
            ("INNERGRID",     (0, 0), (-1, -1), 0.5, BORDER),
            ("TOPPADDING",    (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING",   (0, 0), (-1, -1), 14),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(mkt_table)
        section_gap(story, 5)

    # ── INVESTOR VERDICT ──────────────────────────────────────────────────────

    if investor_score:
        section_label(story, "Investor Readiness", S)
        inv_row = Table([[
            Paragraph(investor_score.get("verdict",""),
                      ParagraphStyle("Verdict", fontName="Helvetica", fontSize=10,
                                     textColor=DIM_WHITE, leading=15)),
            Paragraph(str(investor_score.get("investor_score","—")),
                      ParagraphStyle("InvScore", fontName="Helvetica-Bold", fontSize=36,
                                     textColor=CYAN_C, leading=40, alignment=TA_RIGHT)),
        ]], colWidths=[CW * 0.75, CW * 0.25])
        inv_row.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#001A1F")),
            ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#003A4A")),
            ("TOPPADDING",    (0, 0), (-1, -1), 14),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
            ("LEFTPADDING",   (0, 0), (-1, -1), 16),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(inv_row)
        section_gap(story, 5)

    # ── FOOTER ────────────────────────────────────────────────────────────────

    story.append(HRFlowable(width=CW, thickness=0.5, color=BORDER))
    story.append(Spacer(1, 4 * mm))
    footer_table = Table([[
        Paragraph("CORTIQ · STARTUP INTELLIGENCE TERMINAL",
                  ParagraphStyle("FL", fontName="Helvetica", fontSize=6, textColor=MID_WHITE, leading=8)),
        Paragraph(f"NOT FINANCIAL ADVICE  ·  {date.today().strftime('%B %d, %Y')}",
                  ParagraphStyle("FR", fontName="Helvetica", fontSize=6, textColor=MID_WHITE,
                                 leading=8, alignment=TA_RIGHT)),
    ]], colWidths=[CW / 2, CW / 2])
    footer_table.setStyle(TableStyle([
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
    ]))
    story.append(footer_table)

    # ── BUILD ─────────────────────────────────────────────────────────────────

    def on_page(canvas, doc):
        canvas.setFillColor(BG)
        canvas.rect(0, 0, W, H, fill=1, stroke=0)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="cortiq-analysis.pdf"'},
    )