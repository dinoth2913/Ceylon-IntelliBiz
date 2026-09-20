import re
from dataclasses import dataclass
from typing import Callable

from models import BusinessContext, ChatResponse


def format_lkr(amount: float) -> str:
    if amount >= 1_000_000:
        return f"LKR {amount / 1_000_000:.2f}M"
    if amount >= 1_000:
        return f"LKR {amount / 1_000:.1f}K"
    return f"LKR {amount:.0f}"


def plural(count: int, singular: str, plural: str | None = None) -> str:
    return f"{count} {singular if count == 1 else plural or singular + 's'}"


@dataclass(frozen=True)
class Intent:
    name: str
    # A trailing "*" makes a keyword a prefix match ("forecast*" hits "forecasting").
    # Multi-word keywords weigh more, so "next month" beats a stray "month".
    keywords: tuple[str, ...]
    suggestions: tuple[str, ...] = ()


# Order matters: on a score tie the earlier intent wins, so data intents sit above chit-chat.
INTENTS: tuple[Intent, ...] = (
    Intent(
        "forecast",
        ("forecast*", "predict*", "projection*", "project*", "next month", "next quarter", "trend*", "growth", "outlook"),
        ("Summarise this week's sales performance", "What should I reorder this week?"),
    ),
    Intent(
        "inventory",
        ("inventory", "stock*", "reorder*", "restock*", "sku*", "warehouse*", "low on", "running out", "shortage*"),
        ("Do I have overdue invoices?", "Summarise this week's sales performance"),
    ),
    Intent(
        "finance",
        ("invoice*", "payment*", "overdue", "outstanding", "billing", "finance", "cash", "receivable*", "unpaid", "owed"),
        ("What should I reorder this week?", "How many customers do I have?"),
    ),
    Intent(
        "sales",
        ("sales", "revenue", "order*", "sold", "performance", "summar*", "turnover", "how is business", "how's business"),
        ("Do I have overdue invoices?", "Forecast next month's revenue"),
    ),
    Intent(
        "customers",
        ("customer*", "client*", "crm", "churn*", "at risk", "lead*", "contact*"),
        ("Summarise this week's sales performance", "Do I have overdue invoices?"),
    ),
    Intent(
        "marketplace",
        ("marketplace", "vendor*", "supplier*", "catalog*", "catalogue*", "storefront", "checkout"),
        ("What does IntelliBiz cost?", "What can you do?"),
    ),
    Intent(
        "pricing",
        ("price*", "pricing", "cost*", "plan*", "quote*", "subscription*"),
        ("What can you do?", "Tell me about the marketplace"),
    ),
    Intent(
        "help",
        ("help", "what can you do", "what do you do", "who are you", "what are you", "support", "features", "capabilit*"),
        ("Summarise this week's sales performance", "What should I reorder this week?", "Do I have overdue invoices?"),
    ),
    Intent("thanks", ("thanks", "thank you", "cheers", "appreciate*"), ("What can you do?",)),
    Intent(
        "greeting",
        ("hi", "hello", "hey", "good morning", "good afternoon", "good evening", "ayubowan"),
        ("Summarise this week's sales performance", "What should I reorder this week?"),
    ),
)

FALLBACK_SUGGESTIONS = (
    "Summarise this week's sales performance",
    "What should I reorder this week?",
    "Do I have overdue invoices?",
    "What can you do?",
)


def _compile(keyword: str) -> tuple[re.Pattern[str], int]:
    weight = len(keyword.split())
    if keyword.endswith("*"):
        return re.compile(r"\b" + re.escape(keyword[:-1])), weight
    return re.compile(r"\b" + re.escape(keyword) + r"\b"), weight


_PATTERNS: dict[str, list[tuple[re.Pattern[str], int]]] = {
    intent.name: [_compile(keyword) for keyword in intent.keywords] for intent in INTENTS
}


def _normalise(message: str) -> str:
    return " ".join(re.sub(r"[^a-z0-9\s']", " ", message.lower()).split())


def classify(message: str) -> Intent | None:
    text = _normalise(message)
    best: Intent | None = None
    best_score = 0
    for intent in INTENTS:
        score = sum(weight for pattern, weight in _PATTERNS[intent.name] if pattern.search(text))
        if score > best_score:
            best, best_score = intent, score
    return best


_SIGN_IN_HINT = "Sign in to your workspace and I can answer with your live numbers."


def _reply_sales(ctx: BusinessContext | None) -> str:
    if ctx is None:
        return f"I can summarise orders, revenue and fulfilment for your business. {_SIGN_IN_HINT}"
    orders, invoices = ctx.orders, ctx.invoices
    if orders.total == 0:
        return "There are no orders recorded yet, so there is nothing to summarise. Once orders come in I can break them down by status."
    parts = [
        f"You have {plural(orders.total, 'order')} worth {format_lkr(orders.value)}: "
        f"{orders.fulfilled} fulfilled, {orders.processing} processing, "
        f"{orders.pending_payment} awaiting payment and {orders.cancelled} cancelled."
    ]
    if invoices.total:
        parts.append(f"{format_lkr(invoices.paid_amount)} has been collected on paid invoices.")
    if orders.pending_payment:
        parts.append(f"{plural(orders.pending_payment, 'order')} still waiting on payment are worth chasing.")
    return " ".join(parts)


def _reply_inventory(ctx: BusinessContext | None) -> str:
    if ctx is None:
        return f"I can flag stock that has fallen to its reorder level and tell you what to reorder. {_SIGN_IN_HINT}"
    inventory = ctx.inventory
    if inventory.skus == 0:
        return "No inventory items are recorded yet. Add products with stock levels and I'll flag anything that needs reordering."
    if not inventory.low_stock:
        return f"All {plural(inventory.skus, 'SKU')} are above their reorder level, so nothing needs reordering right now."
    worst_first = sorted(inventory.low_stock, key=lambda item: item.stock / max(item.reorder_level, 1))
    shown = "; ".join(f"{item.name} ({item.stock} left, reorder at {item.reorder_level})" for item in worst_first[:3])
    extra = len(worst_first) - 3
    more = f" and {extra} more" if extra > 0 else ""
    return (
        f"{len(worst_first)} of {plural(inventory.skus, 'SKU')} are at or below their reorder level. "
        f"Most urgent first: {shown}{more}."
    )


def _reply_finance(ctx: BusinessContext | None) -> str:
    if ctx is None:
        return f"I can track paid, outstanding and overdue invoices for you. {_SIGN_IN_HINT}"
    invoices = ctx.invoices
    if invoices.total == 0:
        return "No invoices have been issued yet."
    parts = [
        f"Of {plural(invoices.total, 'invoice')}: {invoices.paid} paid ({format_lkr(invoices.paid_amount)}), "
        f"{invoices.outstanding} outstanding ({format_lkr(invoices.outstanding_amount)}) "
        f"and {invoices.draft} in draft."
    ]
    if invoices.overdue:
        parts.append(
            f"{plural(invoices.overdue, 'invoice')} {'is' if invoices.overdue == 1 else 'are'} overdue, "
            f"totalling {format_lkr(invoices.overdue_amount)} - those are the ones to chase first."
        )
    else:
        parts.append("Nothing is overdue.")
    return " ".join(parts)


def _reply_customers(ctx: BusinessContext | None) -> str:
    if ctx is None:
        return f"I can report on your customer base and help you keep track of relationships. {_SIGN_IN_HINT}"
    return (
        f"You have {plural(ctx.customers, 'customer')} on record. "
        "I can't score churn risk yet because that needs purchase and contact history, which isn't tracked so far."
    )


def _reply_forecast(ctx: BusinessContext | None) -> str:
    base = "I don't have a statistical forecasting model yet - I'm a rule-based assistant, so I won't invent a projection."
    if ctx is None or ctx.orders.total == 0:
        return f"{base} Once there is order history I can show you the open pipeline."
    return (
        f"{base} What I can tell you is that {format_lkr(ctx.orders.open_value)} is sitting in open orders "
        f"(processing or awaiting payment), which is the revenue most likely to land next."
    )


def _static(text: str) -> Callable[[BusinessContext | None], str]:
    return lambda _ctx: text


_REPLIES: dict[str, Callable[[BusinessContext | None], str]] = {
    "sales": _reply_sales,
    "inventory": _reply_inventory,
    "finance": _reply_finance,
    "customers": _reply_customers,
    "forecast": _reply_forecast,
    "marketplace": _static(
        "The marketplace covers vendor onboarding, product catalogues, reviews and checkout. "
        "Browse it from the Marketplace page in the top navigation."
    ),
    "pricing": _static(
        "IntelliBiz pricing is tailored to the size of your business, from startups to large enterprises. "
        "Contact the sales team for a quote."
    ),
    "help": _static(
        "I can summarise orders and revenue, flag stock that needs reordering, report on invoices and overdue payments, "
        "and count your customers. Sign in to get answers based on your live data."
    ),
    "thanks": _static("You're welcome! Ask me anything else about your business."),
    "greeting": _static("Hello! I'm the IntelliBiz assistant. Ask me about sales, inventory, invoices or customers."),
}


def respond(message: str, context: BusinessContext | None = None) -> ChatResponse:
    intent = classify(message)
    if intent is None:
        return ChatResponse(
            reply=(
                "I'm not sure I understood that. I can help with sales, inventory, invoices and customers - "
                "try one of the suggestions below."
            ),
            intent="unknown",
            suggestions=list(FALLBACK_SUGGESTIONS),
        )
    return ChatResponse(reply=_REPLIES[intent.name](context), intent=intent.name, suggestions=list(intent.suggestions))
