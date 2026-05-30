"""
AI Insight Engine for 23 Paskal Analytics SaaS.

Generates executive-level strategic intelligence reports in Indonesian
(Formal Business Style) from raw analytic data.

Architecture:
  - Primary:  LangChain + OpenAI GPT-4o  (structured JSON output)
  - Fallback: LangChain + Anthropic Claude 3.5 Sonnet
  - Offline:  Rule-based Indonesian narrative (no API key required)

Output Contract (InsightOutput):
  - summary_text   : 3-paragraph executive summary (Indonesian)
  - action_items   : 3–5 actionable recommendations (Indonesian)
  - hero_category  : Category driving positive growth
  - drag_category  : Category causing biggest revenue drag
  - rising_stars   : Tenant names with >20% WoW growth
  - at_risk_tenants: Tenant names with ≥3 consecutive declining periods
  - anomalies      : Detected behavioural anomalies
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field

log = logging.getLogger(__name__)


# ── Pydantic I/O Schemas ───────────────────────────────────────────────────────

class TenantSnapshotItem(BaseModel):
    tenant_name:      str
    category:         str
    total_revenue:    float
    transaction_count:int
    growth_pct:       float


class MemberTierSnapshot(BaseModel):
    tier:             str           # Bronze / Silver / Gold / Platinum
    total_revenue:    float
    transaction_count:int
    growth_pct:       float         # vs previous period


class PeakHourItem(BaseModel):
    hour:             int           # 0–23
    day_of_week:      str           # "Senin", "Selasa", …
    transaction_count:int
    total_revenue:    float
    is_anomaly:       bool = False   # True if statistically unexpected


class SocialSnapshot(BaseModel):
    total_reach:        int
    total_engagements:  int
    engagement_rate:    float
    top_platform:       Optional[str] = None

class UnifiedContext(BaseModel):
    correlation_score:  float
    correlation_insight: str

class InsightRequest(BaseModel):
    """
    Payload sent to the AI engine. Callers (the FastAPI endpoint)
    build this by aggregating multiple DB queries.
    """
    period:          str            # weekly | biweekly | monthly | yearly
    period_label:    str            # "Minggu Ini" | "Bulan Ini" | …
    mall_name:       str            = "23 Paskal Shopping Center"
    mall_id:         str

    # Financial summary
    current_amount:  float
    previous_amount: float
    growth_pct:      float

    # Social Media Data
    social_data:     Optional[SocialSnapshot] = None
    unified_data:    Optional[UnifiedContext] = None

    # Category breakdown  {category: revenue}
    category_current:  dict[str, float]
    category_previous: dict[str, float]

    # Tenant performance
    top_tenants:               list[TenantSnapshotItem]   # top 5 by revenue
    bottom_tenants:            list[TenantSnapshotItem]   # bottom 5 by revenue
    consecutive_declining:     list[str]                  # ≥3 periods of decline

    # Member tiers
    member_tier_data:          list[MemberTierSnapshot]

    # Peak hours (top 10 busiest slots)
    peak_hours:                list[PeakHourItem]

    # Context
    analysis_date:   str            = Field(default_factory=lambda: datetime.now(tz=timezone.utc).strftime("%d %B %Y"))


class InsightOutput(BaseModel):
    """Structured response from the AI engine."""
    summary_text:    str            # 3-paragraph executive summary
    action_items:    list[str]      # 3–5 concrete recommendations

    # Derived labels (populated by AI or rule-based fallback)
    hero_category:   Optional[str]  = None
    drag_category:   Optional[str]  = None
    rising_stars:    list[str]      = Field(default_factory=list)
    at_risk_tenants: list[str]      = Field(default_factory=list)
    anomalies:       list[str]      = Field(default_factory=list)

    # Metadata
    generated_at:    str            = Field(default_factory=lambda: datetime.now(tz=timezone.utc).isoformat())
    model_used:      str            = "rule-based"
    cached:          bool           = False


# ── Prompt Builder ─────────────────────────────────────────────────────────────

def _build_prompt(req: InsightRequest) -> str:
    """
    Construct the full analytical context as a structured prompt.
    The LLM is instructed to respond ONLY in Indonesian formal business style.
    """
    # ── Rising stars (>20% growth in top tenants) ───────────────────────────
    rising = [t.tenant_name for t in req.top_tenants if t.growth_pct >= 20]
    at_risk = req.consecutive_declining

    # ── Category delta ──────────────────────────────────────────────────────
    cat_delta: list[str] = []
    all_cats  = set(req.category_current) | set(req.category_previous)
    for cat in all_cats:
        cur = req.category_current.get(cat, 0)
        prv = req.category_previous.get(cat, 0)
        delta = ((cur - prv) / prv * 100) if prv else (100.0 if cur > 0 else 0.0)
        cat_delta.append(f"  - {cat}: Rp {cur:,.0f} ({delta:+.1f}%)")
    cat_section = "\n".join(sorted(cat_delta))

    # ── Member tier section ─────────────────────────────────────────────────
    tier_lines = "\n".join(
        f"  - {t.tier}: Rp {t.total_revenue:,.0f} | {t.transaction_count:,} transaksi | {t.growth_pct:+.1f}% WoW"
        for t in sorted(req.member_tier_data, key=lambda x: -x.total_revenue)
    )

    # ── Top tenants ─────────────────────────────────────────────────────────
    top_lines = "\n".join(
        f"  {i+1}. {t.tenant_name} ({t.category}): Rp {t.total_revenue:,.0f} | {t.growth_pct:+.1f}% WoW"
        for i, t in enumerate(req.top_tenants[:5])
    )

    # ── Bottom tenants ──────────────────────────────────────────────────────
    bot_lines = "\n".join(
        f"  {i+1}. {t.tenant_name} ({t.category}): Rp {t.total_revenue:,.0f} | {t.growth_pct:+.1f}% WoW"
        for i, t in enumerate(req.bottom_tenants[:5])
    )

    # ── Peak hours ───────────────────────────────────────────────────────────
    peak_lines = "\n".join(
        f"  - Pukul {h.hour:02d}:00 {h.day_of_week}: {h.transaction_count:,} transaksi"
        f"{'  ⚠ ANOMALI' if h.is_anomaly else ''}"
        for h in sorted(req.peak_hours, key=lambda x: -x.transaction_count)[:6]
    )

    anomaly_hours = [h for h in req.peak_hours if h.is_anomaly]
    # ── Social Media & Unified Data ──────────────────────────────────────────
    social_section = "  - Data media sosial belum tersedia."
    if req.social_data:
        social_section = (
            f"  - Total Reach: {req.social_data.total_reach:,}\n"
            f"  - Total Engagement: {req.social_data.total_engagements:,}\n"
            f"  - Engagement Rate: {req.social_data.engagement_rate:%.2f}%\n"
            f"  - Platform Utama: {req.social_data.top_platform or 'N/A'}"
        )

    unified_section = "  - Koreksi antar-saluran belum tersedia."
    if req.unified_data:
        unified_section = (
            f"  - Skor Korelasi (Social vs Sales): {req.unified_data.correlation_score:%.2f}\n"
            f"  - Insight: {req.unified_data.correlation_insight}"
        )

    prompt = f"""
Anda adalah Konsultan Strategis Utama (Chief Strategy Officer) untuk Pemilik {req.mall_name}, Bandung.
Gaya Komunikasi: Eksekutif, tajam, analitis tinggi, dan berorientasi pada ROI (Return on Investment) serta Optimalisasi Aset.

Tujuan: Memberikan laporan intelijen yang membedah korelasi data untuk pengambilan keputusan taktis dan strategis.

Konteks Analisis:
- Tanggal Analisis  : {req.analysis_date}
- Periode           : {req.period_label}
- Pertumbuhan Rev   : {req.growth_pct:+.2f}%
- Revenue Saat Ini  : Rp {req.current_amount:,.0f}
- Revenue Lalu      : Rp {req.previous_amount:,.0f}

Ringkasan Kinerja Kategori:
{cat_section}

Top 5 Tenant (Revenue & Momentum):
{top_lines}

Rising Stars (>20% WoW): {', '.join(rising) if rising else 'Stabil'}

Bottom 5 Tenant (Underperformers):
{bot_lines}

Tenant Berisiko (Penurunan Berkelanjutan): {', '.join(at_risk) if at_risk else 'Minim'}

Segmentasi Member (Customer Lifetime Value Focus):
{tier_lines}

Pola Operasional (Peak Hours - Traffic Management):
{peak_lines}

Kinerja Media Sosial & Unified Intelligence:
{social_section}
{unified_section}

TUGAS ANDA:
1. Analisis SUMMARY_TEXT (3 Paragraf):
   - Paragraf 1 (Macro): Bedah efisiensi pertumbuhan. Apakah pertumbuhan ini didorong oleh volume transaksi atau kenaikan ATV? Bagaimana perbandingannya dengan performa kategori?
   - Paragraf 2 (Micro): Analisis ekosistem tenant. Identifikasi 'Strategic Anchors' vs 'Growth Racers'. Berikan opini tentang tenant mix saat ini—apakah sudah optimal atau perlu re-zoning?
   - Paragraf 3 (Strategic): Hubungkan pola Peak Hours dengan segmentasi Member. Bagaimana cara menarik member Platinum di jam-jam non-sibuk? Berikan insight korelasi media sosial jika tersedia.

2. ACTION_ITEMS (5 Poin):
   - Harus sangat spesifik, terukur, dan memiliki dampak bisnis langsung.
   - Gunakan terminologi: 'Cross-Category Synergy', 'Yield Management', 'Traffic Conversion', 'Customer Retention'.

STRUKTUR JSON (WAJIB):
{{
  "summary_text": "...",
  "action_items": ["...", "...", "...", "...", "..."],
  "hero_category": "...",
  "drag_category": "...",
  "rising_stars": [...],
  "at_risk_tenants": [...],
  "anomalies": [...]
}}
"""
    return prompt.strip()


# ── LLM Engine ────────────────────────────────────────────────────────────────

def _get_llm(settings: Any) -> Any:
    """Return the configured LangChain chat model, or None if no key is set."""
    openai_key = getattr(settings, "OPENAI_API_KEY", "") or ""
    anthropic_key = getattr(settings, "ANTHROPIC_API_KEY", "") or ""
    gemini_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    model_pref = getattr(settings, "AI_PROVIDER", "openai").lower()

    if model_pref == "anthropic" and anthropic_key:
        try:
            from langchain_anthropic import ChatAnthropic  # type: ignore[import-not-found]
            log.info("AI Engine: using Anthropic Claude 3.5 Sonnet")
            return ChatAnthropic(
                model="claude-3-5-sonnet-20241022",
                api_key=anthropic_key,
                max_tokens=2048,
                temperature=0.4,
            )
        except ImportError:
            log.warning("langchain-anthropic not installed; trying OpenAI next.")

    if openai_key:
        try:
            from langchain_openai import ChatOpenAI  # type: ignore[import-not-found]
            log.info("AI Engine: using OpenAI GPT-4o")
            return ChatOpenAI(
                model="gpt-4o",
                api_key=openai_key,
                temperature=0.4,
                max_tokens=2048,
            )
        except ImportError:
            log.warning("langchain-openai not installed.")

    if anthropic_key:
        try:
            from langchain_anthropic import ChatAnthropic  # type: ignore[import-not-found]
            log.info("AI Engine: using Anthropic Claude 3.5 Sonnet (fallback)")
            return ChatAnthropic(
                model="claude-3-5-sonnet-20241022",
                api_key=anthropic_key,
                max_tokens=2048,
                temperature=0.4,
            )
        except ImportError:
            pass

    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore[import-not-found]
            log.info("AI Engine: using Google Gemini 1.5 Pro")
            return ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                google_api_key=gemini_key,
                temperature=0.4,
                max_output_tokens=2048,
            )
        except ImportError:
            pass

    log.warning("AI Engine: No API key configured. Using rule-based fallback.")
    return None


async def _invoke_llm(llm: Any, prompt: str) -> dict:
    """
    Invoke the LLM and parse the JSON response.
    Uses LangChain's structured output when the model supports it;
    falls back to raw JSON parsing.
    """
    import json as _json
    import re

    from langchain_core.messages import HumanMessage

    messages = [HumanMessage(content=prompt)]

    try:
        # Prefer async invoke
        response = await llm.ainvoke(messages)
        raw_text = response.content
    except Exception as exc:
        log.error("LLM invocation failed: %s", exc)
        raise

    # Strip markdown fences if the model wrapped the JSON
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
        raw_text = re.sub(r"\n?```$", "", raw_text)

    try:
        return _json.loads(raw_text)
    except _json.JSONDecodeError as exc:
        # Attempt to extract JSON block from surrounding text
        match = re.search(r"\{[\s\S]+\}", raw_text)
        if match:
            return _json.loads(match.group())
        log.error("Failed to parse LLM JSON output: %s\nRaw: %s", exc, raw_text[:500])
        raise ValueError("LLM did not return valid JSON.") from exc


# ── Rule-Based Fallback (Bahasa Indonesia) ────────────────────────────────────

def _rule_based_insight(req: InsightRequest) -> InsightOutput:
    """
    Generates a deterministic Indonesian-language insight when no LLM is available.
    Follows the same output schema as the AI path.
    """
    is_growth = req.growth_pct >= 0
    growth_abs = abs(req.growth_pct)

    # Hero / Drag category
    cat_deltas: dict[str, float] = {}
    for cat in set(req.category_current) | set(req.category_previous):
        cur = req.category_current.get(cat, 0)
        prv = req.category_previous.get(cat, 0)
        cat_deltas[cat] = ((cur - prv) / prv * 100) if prv else (100.0 if cur else 0.0)

    hero_cat   = max(cat_deltas, key=cat_deltas.get) if cat_deltas else None       # type: ignore[arg-type]
    drag_cat   = min(cat_deltas, key=cat_deltas.get) if cat_deltas else None       # type: ignore[arg-type]
    rising     = [t.tenant_name for t in req.top_tenants if t.growth_pct >= 20]
    at_risk    = req.consecutive_declining
    anomalies  = [
        f"Lonjakan tidak lazim pukul {h.hour:02d}:00 hari {h.day_of_week} "
        f"({h.transaction_count:,} transaksi)"
        for h in req.peak_hours if h.is_anomaly
    ]

    top1 = req.top_tenants[0] if req.top_tenants else None
    gold_tier = next((t for t in req.member_tier_data if t.tier == "Gold"), None)

    # ── Paragraph 1: Pertumbuhan Strategis ──────────────────────────────────
    if is_growth:
        p1 = (
            f"Performa {req.period_label.lower()} {req.mall_name} menunjukkan tren positif yang signifikan "
            f"dengan kenaikan pendapatan sebesar {growth_abs:.1f}% dibandingkan periode sebelumnya, "
            f"mencapai Rp {req.current_amount:,.0f} dari Rp {req.previous_amount:,.0f}. "
            f"Kategori '{hero_cat}' menjadi Hero Category periode ini dengan kontribusi pertumbuhan tertinggi, "
            f"mengindikasikan respons pasar yang kuat terhadap bauran tenant saat ini."
        )
    else:
        p1 = (
            f"Performa {req.period_label.lower()} {req.mall_name} mengalami koreksi sebesar {growth_abs:.1f}% "
            f"dengan total pendapatan Rp {req.current_amount:,.0f} dibandingkan Rp {req.previous_amount:,.0f} "
            f"pada periode sebelumnya. "
            f"Analisis kategori mengidentifikasi '{drag_cat}' sebagai penyebab penurunan terbesar, "
            f"memerlukan intervensi strategis segera untuk memulihkan momentum."
        )

    # ── Paragraph 2: Tenant & Member ────────────────────────────────────────
    top_txt = f"{top1.tenant_name} ({top1.category}) memimpin performa dengan pendapatan Rp {top1.total_revenue:,.0f} ({top1.growth_pct:+.1f}% WoW). " if top1 else ""
    rising_txt = (
        f"Rising Stars periode ini meliputi {', '.join(rising)}, yang masing-masing mencatatkan pertumbuhan di atas 20%. "
        if rising else ""
    )
    at_risk_txt = (
        f"Peringatan dini: {', '.join(at_risk)} mencatatkan penurunan selama ≥3 periode berturut-turut dan memerlukan program dukungan segera. "
        if at_risk else ""
    )
    gold_txt = (
        f"Segmen Gold Member mencatat pertumbuhan {gold_tier.growth_pct:+.1f}% pada periode ini, "
        f"mengindikasikan efektivitas program loyalitas premium dalam mendorong kunjungan berulang. "
        if gold_tier else ""
    )
    p2 = top_txt + rising_txt + at_risk_txt + gold_txt
    if not p2.strip():
        p2 = "Data performa tenant dan segmentasi member untuk periode ini sedang dalam proses kompilasi lebih lanjut."

    # ── Paragraph 3: Pola Perilaku ───────────────────────────────────────────
    peak_sorted = sorted(req.peak_hours, key=lambda x: -x.transaction_count)
    if peak_sorted:
        pkh = peak_sorted[0]
        p3 = (
            f"Analisis pola kunjungan menunjukkan jam puncak tertinggi pada pukul {pkh.hour:02d}:00 hari {pkh.day_of_week} "
            f"dengan {pkh.transaction_count:,} transaksi. "
        )
    else:
        p3 = "Pola kunjungan konsumen untuk periode ini belum tersedia secara lengkap. "

    if anomalies:
        p3 += f"Terdeteksi {len(anomalies)} anomali transaksi yang memerlukan investigasi lebih lanjut: " + "; ".join(anomalies) + "."
    else:
        p3 += "Tidak ditemukan anomali transaksi yang signifikan pada periode ini."

    summary = f"{p1}\n\n{p2}\n\n{p3}"

    # ── Action Items ─────────────────────────────────────────────────────────
    actions: list[str] = []

    if not is_growth and drag_cat:
        actions.append(
            f"Luncurkan program promosi taktis untuk kategori '{drag_cat}' pada akhir pekan mendatang "
            f"guna memulihkan momentum penjualan yang melemah."
        )
    if rising:
        actions.append(
            f"Tingkatkan eksposur dan alokasi ruang promosi untuk {rising[0]} sebagai Rising Star "
            f"guna memaksimalkan potensi pendapatan yang sedang tumbuh."
        )
    if at_risk:
        actions.append(
            f"Lakukan rapat evaluasi bisnis dengan manajemen {at_risk[0]} untuk mengidentifikasi "
            f"akar masalah penurunan berturut-turut dan susun rencana pemulihan 30 hari."
        )
    if peak_sorted:
        pk = peak_sorted[0]
        actions.append(
            f"Optimalkan staffing dan kapasitas operasional pada pukul {pk.hour:02d}:00 hari {pk.day_of_week} "
            f"untuk mengakomodasi puncak kunjungan dan meningkatkan pengalaman belanja."
        )
    if anomalies:
        actions.append(
            "Investigasi anomali transaksi pada jam yang teridentifikasi; pertimbangkan penyesuaian jam operasional "
            "atau kampanye promosi bertarget untuk memaksimalkan peluang tersebut."
        )
    if gold_tier and gold_tier.growth_pct > 0:
        actions.append(
            f"Perluas program eksklusif Gold Member dengan penambahan benefit baru untuk mempertahankan "
            f"momentum pertumbuhan segmen bernilai tinggi ini."
        )

    # Ensure minimum 3 actions
    if len(actions) < 3:
        actions.append(
            "Lakukan analisis dwell-time di area F&B dan Fashion untuk mengidentifikasi peluang "
            "cross-selling antar tenant."
        )
    if len(actions) < 3:
        actions.append(
            "Tinjau efektivitas program pemasaran digital dan frekuensi komunikasi kepada basis member "
            "aktif untuk mendorong kunjungan di luar jam puncak."
        )

    return InsightOutput(
        summary_text   = summary,
        action_items   = actions[:5],
        hero_category  = hero_cat if is_growth else None,
        drag_category  = drag_cat if not is_growth else None,
        rising_stars   = rising,
        at_risk_tenants= at_risk,
        anomalies      = anomalies,
        model_used     = "rule-based-id",
    )


# ── Public Entry Point ────────────────────────────────────────────────────────

async def generate_insights(req: InsightRequest, settings: Any) -> InsightOutput:
    """
    Main entry point called by the FastAPI endpoint.

    1. Try LLM (OpenAI → Anthropic → Gemini)
    2. On any failure (no key, API error, JSON parse error), fall back to rule-based
    """
    llm = _get_llm(settings)

    if llm is None:
        output = _rule_based_insight(req)
        output.model_used = "rule-based-id (no API key)"
        return output

    prompt = _build_prompt(req)

    try:
        raw = await _invoke_llm(llm, prompt)

        # Coerce raw dict into InsightOutput
        output = InsightOutput(
            summary_text   = raw.get("summary_text",    raw.get("summary", "")),
            action_items   = raw.get("action_items",    raw.get("recommendations", [])),
            hero_category  = raw.get("hero_category"),
            drag_category  = raw.get("drag_category"),
            rising_stars   = raw.get("rising_stars",    []),
            at_risk_tenants= raw.get("at_risk_tenants", []),
            anomalies      = raw.get("anomalies",       []),
            model_used     = getattr(llm, "model_name", getattr(llm, "model", "unknown")),
        )
        return output

    except Exception as exc:
        log.error("LLM insight generation failed (%s); using rule-based fallback.", exc)
        output = _rule_based_insight(req)
        output.model_used = f"rule-based-id (LLM error: {type(exc).__name__})"
        return output
