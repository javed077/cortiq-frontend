# ── ADD TO main.py ────────────────────────────────────────────────────────────
# pip install pptxgenjs  ← handled via Node; see generate_deck.js below
# npm install -g pptxgenjs
#
# Add these imports at top of main.py:
#   import subprocess, tempfile, shutil
#   from fastapi.responses import FileResponse
# ──────────────────────────────────────────────────────────────────────────────

import subprocess, tempfile, shutil
from fastapi.responses import FileResponse


# ── /pitch-deck  (content generation) ─────────────────────────────────────────

_PITCH_FALLBACK = {
    "slides": [
        {"title": "Cover",          "tagline": "Building the future", "content": []},
        {"title": "Problem",        "content": ["Large underserved pain point", "Existing solutions fall short", "Growing urgency"]},
        {"title": "Solution",       "content": ["Purpose-built product", "10x better than status quo", "Defensible technology"]},
        {"title": "Market Size",    "content": ["$1B+ total addressable market", "18% CAGR through 2028", "Early market timing advantage"]},
        {"title": "Traction",       "content": ["Early customer validation", "Strong week-over-week growth", "Key design partners signed"]},
        {"title": "Business Model", "content": ["SaaS subscription revenue", "Land and expand motion", "Negative churn target"]},
        {"title": "Competition",    "content": ["Fragmented incumbent landscape", "No direct competitor at our layer", "Strong network effect moat"]},
        {"title": "Team",           "content": ["Experienced founding team", "Deep domain expertise", "Prior exits / relevant background"]},
        {"title": "Financials",     "content": ["18+ months runway", "Clear path to profitability", "Capital efficient model"]},
        {"title": "The Ask",        "content": ["Raising $X seed round", "Use of funds: product & GTM", "Target: Series A in 18 months"]},
    ]
}

@app.post("/pitch-deck")
def pitch_deck_content(payload: dict):
    result          = payload.get("result", {})
    form            = payload.get("form", {})
    strategy        = payload.get("strategy", [])
    market_research = payload.get("marketResearch", {})
    investor_score  = payload.get("investorScore", {})
    tone            = payload.get("tone", "investor")
    slides_count    = payload.get("slides_count", 10)

    system = (
        "You are a world-class pitch deck writer who has helped companies raise "
        "over $500M. Return valid JSON only — no markdown, no preamble."
    )

    user = f"""
Startup: {form.get("idea", "")}
Customer: {form.get("customer", "")}  Geography: {form.get("geography", "")}
TAM: ${form.get("tam", 0):,}  Team: {form.get("team_size", 1)} people
Revenue: ${form.get("current_revenue", 0):,}/mo  Burn: ${form.get("monthly_burn", 0):,}/mo
Budget: ${form.get("available_budget", 0):,}  Runway: {result.get("runway_months", 0)} months
Competitors: {form.get("competitors", "")}
Situation: {form.get("situation", "")}

Health Scores — Market:{result.get("market_health")}  Execution:{result.get("execution_health")}  Finance:{result.get("finance_health")}
Investor Score: {investor_score.get("investor_score") if investor_score else "N/A"}  Verdict: {investor_score.get("verdict") if investor_score else "N/A"}
Market Size: {market_research.get("market_size") if market_research else "N/A"}  Growth: {market_research.get("growth_rate") if market_research else "N/A"}
Key insight: {result.get("insight", "")}
Strategic recommendations: {", ".join(strategy) if strategy else "N/A"}

Write a compelling {slides_count}-slide pitch deck for a {tone} audience.
Make it specific, data-rich, and compelling — not generic.

Return EXACTLY:
{{
  "slides": [
    {{
      "title": "<slide title>",
      "tagline": "<optional one-line hook for cover/section slides>",
      "content": ["<bullet 1>", "<bullet 2>", "<bullet 3>"],
      "speaker_note": "<what to say out loud for this slide>"
    }}
  ]
}}
"""
    result_data = llm(system, user, temperature=0.6)
    if result_data and isinstance(result_data.get("slides"), list) and len(result_data["slides"]) >= 5:
        return result_data
    return _PITCH_FALLBACK


# ── /pitch-deck/download  (pptx file generation) ──────────────────────────────

DECK_SCRIPT = """
const pptxgen = require("pptxgenjs");

const payload = JSON.parse(process.argv[2]);
const slides  = payload.slides || [];
const form    = payload.form   || {};
const outPath = payload.outPath;

// ── palette ──────────────────────────────────────────────────────────────────
const BG      = "050505";
const ACCENT  = "C8FF00";
const CYAN    = "00E5FF";
const WHITE   = "FFFFFF";
const DIM     = "AAAAAA";
const CARD    = "111111";
const BORDER  = "222222";

const SLIDE_COLORS = [
  ACCENT, CYAN, "FFB800", "FF6B6B", "A855F7",
  ACCENT, CYAN, "FFB800", "FF6B6B", "A855F7", ACCENT, CYAN,
];

// ── presentation setup ────────────────────────────────────────────────────────
let pres       = new pptxgen();
pres.layout    = "LAYOUT_16x9";
pres.author    = "Cortiq AI";
pres.title     = form.idea || "Startup Pitch Deck";
pres.subject   = "AI-generated pitch deck";

// ── slide factory ─────────────────────────────────────────────────────────────
slides.forEach((slide, idx) => {
  const s     = pres.addSlide();
  const color = SLIDE_COLORS[idx % SLIDE_COLORS.length];
  const isCover = idx === 0;

  // dark background
  s.background = { color: BG };

  // left accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.06, h: 5.625,
    fill: { color },
    line: { color, width: 0 },
  });

  // slide number badge
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.2, y: 0.15, w: 0.55, h: 0.28,
    fill: { color: "161616" },
    line: { color: BORDER, width: 0.5 },
  });
  s.addText(String(idx + 1).padStart(2, "0"), {
    x: 9.2, y: 0.15, w: 0.55, h: 0.28,
    fontFace: "Courier New", fontSize: 7, color: "555555",
    align: "center", valign: "middle", margin: 0,
  });

  if (isCover) {
    // ── COVER LAYOUT ─────────────────────────────────────────────────────────

    // large accent hexagon decoration (simulated with text)
    s.addText("⬡", {
      x: 6.8, y: 0.5, w: 2.8, h: 2.8,
      fontFace: "Segoe UI Symbol", fontSize: 180,
      color: color + "18", align: "center", valign: "middle",
    });

    s.addText("CORTIQ", {
      x: 0.4, y: 0.3, w: 3, h: 0.3,
      fontFace: "Courier New", fontSize: 8, color: "444444",
      charSpacing: 6,
    });

    s.addText(form.idea || slide.title || "Our Startup", {
      x: 0.4, y: 1.1, w: 6.2, h: 1.8,
      fontFace: "Arial Black", fontSize: 38, color: WHITE,
      bold: true, valign: "top", charSpacing: -1,
    });

    if (slide.tagline) {
      s.addText(slide.tagline, {
        x: 0.4, y: 3.1, w: 6.0, h: 0.5,
        fontFace: "Courier New", fontSize: 13, color: color,
        italic: true,
      });
    }

    // divider
    s.addShape(pres.shapes.LINE, {
      x: 0.4, y: 3.75, w: 4, h: 0,
      line: { color, width: 1.5 },
    });

    // meta row
    const metaParts = [
      form.customer   ? form.customer   : null,
      form.geography  ? form.geography  : null,
      new Date().getFullYear().toString(),
    ].filter(Boolean).join("  ·  ");

    s.addText(metaParts, {
      x: 0.4, y: 4.05, w: 9, h: 0.3,
      fontFace: "Courier New", fontSize: 9, color: "555555",
    });

  } else {
    // ── CONTENT LAYOUT ────────────────────────────────────────────────────────

    // section color dot
    s.addShape(pres.shapes.OVAL, {
      x: 0.3, y: 0.25, w: 0.18, h: 0.18,
      fill: { color }, line: { color, width: 0 },
    });

    // title
    s.addText(slide.title || "", {
      x: 0.6, y: 0.16, w: 8.5, h: 0.55,
      fontFace: "Arial Black", fontSize: 22, color: WHITE,
      bold: true, charSpacing: -0.5, margin: 0,
    });

    // tagline / subtitle
    if (slide.tagline) {
      s.addText(slide.tagline, {
        x: 0.6, y: 0.76, w: 8.5, h: 0.35,
        fontFace: "Courier New", fontSize: 11, color,
        italic: true,
      });
    }

    // content bullets
    const bullets = (slide.content || []).slice(0, 5);
    if (bullets.length > 0) {
      const startY = slide.tagline ? 1.28 : 1.05;
      const rowH   = Math.min(0.72, (4.0 - startY) / bullets.length);

      bullets.forEach((line, bi) => {
        const y = startY + bi * rowH;

        // bullet accent shape
        s.addShape(pres.shapes.RECTANGLE, {
          x: 0.55, y: y + 0.13, w: 0.03, h: rowH * 0.55,
          fill: { color: color + "80" }, line: { color: color + "80", width: 0 },
        });

        s.addText(line, {
          x: 0.72, y, w: 9.0, h: rowH,
          fontFace: "Calibri", fontSize: 14, color: "CCCCCC",
          valign: "middle",
        });
      });
    }

    // speaker note chip (bottom right)
    if (slide.speaker_note) {
      s.addNotes(slide.speaker_note);
    }

    // bottom accent line
    s.addShape(pres.shapes.LINE, {
      x: 0.4, y: 5.3, w: 9.2, h: 0,
      line: { color: BORDER, width: 0.5 },
    });

    s.addText(slide.title ? slide.title.toUpperCase() : "", {
      x: 0.4, y: 5.35, w: 9.2, h: 0.2,
      fontFace: "Courier New", fontSize: 6.5, color: "333333",
      charSpacing: 3,
    });
  }
});

pres.writeFile({ fileName: outPath }).then(() => {
  process.stdout.write("OK:" + outPath);
}).catch(err => {
  process.stderr.write("ERR:" + err.message);
  process.exit(1);
});
"""


@app.post("/pitch-deck/download")
def pitch_deck_download(payload: dict):
    """Generate a .pptx file server-side using pptxgenjs via Node subprocess."""

    tmp_dir = tempfile.mkdtemp()
    try:
        # write the generator script
        script_path = os.path.join(tmp_dir, "generate_deck.js")
        out_path    = os.path.join(tmp_dir, "pitch_deck.pptx")

        with open(script_path, "w") as f:
            f.write(DECK_SCRIPT)

        # serialise payload
        deck_payload = json.dumps({**payload, "outPath": out_path})

        result = subprocess.run(
            ["node", script_path, deck_payload],
            capture_output=True, text=True, timeout=30
        )

        if result.returncode != 0 or not os.path.exists(out_path):
            log.error("pptxgenjs error: %s", result.stderr)
            raise HTTPException(status_code=500, detail=f"PPTX generation failed: {result.stderr}")

        return FileResponse(
            out_path,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename="cortiq-pitch-deck.pptx",
            background=None,    # keep temp dir alive until response sent
        )
    except subprocess.TimeoutExpired:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=504, detail="PPTX generation timed out")
    except HTTPException:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))