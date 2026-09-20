from assistant import format_lkr, plural
from models import BusinessContext, Insight

CANCELLATION_RATE_THRESHOLD = 0.2
CANCELLATION_MIN_ORDERS = 5


def _also_restock(others: int) -> str:
    if others <= 0:
        return ""
    return f" {others} more also {'needs' if others == 1 else 'need'} restocking."


def generate_insights(ctx: BusinessContext) -> list[Insight]:
    """Turns a workspace snapshot into insights using plain threshold rules.

    Confidence is 100 where the insight is a hard fact read straight off the data
    (a count crossing a threshold) and lower where it leans on a heuristic.
    """
    drafts: list[tuple[str, str, str, int]] = []  # (category, title, description, confidence)
    inventory, invoices, orders = ctx.inventory, ctx.invoices, ctx.orders

    if inventory.low_stock:
        worst = min(inventory.low_stock, key=lambda item: item.stock / max(item.reorder_level, 1))
        drafts.append((
            "Risk",
            f"Reorder {worst.name} soon" if len(inventory.low_stock) == 1
            else f"{len(inventory.low_stock)} items are at or below reorder level",
            f"{worst.name} is the most urgent with {worst.stock} left against a reorder level of {worst.reorder_level}."
            + _also_restock(len(inventory.low_stock) - 1),
            100,
        ))

    if invoices.overdue:
        drafts.append((
            "Risk",
            f"{plural(invoices.overdue, 'overdue invoice')} to chase",
            f"{format_lkr(invoices.overdue_amount)} is past due. Following up on these first has the fastest cash-flow payoff.",
            100,
        ))

    if orders.pending_payment:
        drafts.append((
            "Automation",
            f"{plural(orders.pending_payment, 'order')} waiting on payment",
            "These orders are held until payment arrives. Automated payment reminders would speed them up.",
            100,
        ))

    if invoices.draft:
        drafts.append((
            "Opportunity",
            f"{plural(invoices.draft, 'draft invoice')} ready to issue",
            f"{format_lkr(invoices.draft_amount)} of billing has been drafted but not sent to customers yet.",
            100,
        ))

    if orders.total >= CANCELLATION_MIN_ORDERS and orders.cancelled / orders.total > CANCELLATION_RATE_THRESHOLD:
        rate = round(100 * orders.cancelled / orders.total)
        drafts.append((
            "Risk",
            f"{rate}% of orders were cancelled",
            f"{orders.cancelled} of {orders.total} orders were cancelled, which is high enough to be worth investigating.",
            80,
        ))

    if orders.open_value > 0:
        drafts.append((
            "Forecast",
            f"{format_lkr(orders.open_value)} in the open pipeline",
            "Orders that are processing or awaiting payment are the revenue most likely to land next. "
            "This is a snapshot, not a statistical forecast.",
            70,
        ))

    if not drafts:
        if orders.total == 0 and invoices.total == 0 and inventory.skus == 0 and ctx.customers == 0:
            drafts.append((
                "Opportunity",
                "Add data to unlock insights",
                "Add customers, orders, invoices and inventory items and this page will start flagging risks and opportunities.",
                100,
            ))
        else:
            drafts.append((
                "Opportunity",
                "Nothing needs attention",
                "No low stock, overdue invoices or unpaid orders were found. Check back as new activity comes in.",
                100,
            ))

    return [
        Insight(id=f"AI-{index}", category=category, title=title, description=description, confidence=confidence)
        for index, (category, title, description, confidence) in enumerate(drafts, start=1)
    ]
