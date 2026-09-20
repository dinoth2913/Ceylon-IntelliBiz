import pytest
from fastapi.testclient import TestClient

from app import app
from assistant import classify, respond
from insights import generate_insights
from models import BusinessContext

client = TestClient(app)

WORKSPACE = BusinessContext.model_validate(
    {
        "customers": 6,
        "orders": {
            "total": 6, "processing": 1, "fulfilled": 3, "pendingPayment": 1, "cancelled": 1,
            "value": 2_200_000, "openValue": 545_400,
        },
        "invoices": {
            "total": 5, "paid": 2, "outstanding": 1, "overdue": 1, "draft": 1,
            "paidAmount": 1_416_400, "outstandingAmount": 486_500, "overdueAmount": 191_200, "draftAmount": 214_300,
        },
        "inventory": {
            "skus": 5,
            "lowStock": [
                {"name": "Reusable Freight Pallet", "stock": 8, "reorderLevel": 25},
                {"name": "Galvanised Roofing Sheet", "stock": 19, "reorderLevel": 40},
                {"name": "Handloom Cotton Fabric Roll", "stock": 42, "reorderLevel": 50},
                {"name": "Slightly Low Item", "stock": 9, "reorderLevel": 10},
            ],
        },
    }
)


@pytest.mark.parametrize(
    "message, intent",
    [
        ("Summarise this week's sales performance", "sales"),
        ("Which customers are at risk of churning?", "customers"),
        ("Forecast next month's revenue", "forecast"),
        ("What should I reorder this week?", "inventory"),
        ("Do I have overdue invoices?", "finance"),
        ("What does IntelliBiz cost?", "pricing"),
        ("Tell me about the marketplace", "marketplace"),
        ("What can you do?", "help"),
        ("hello", "greeting"),
        ("thanks a lot", "thanks"),
    ],
)
def test_classifies_common_questions(message, intent):
    assert classify(message).name == intent


def test_unrecognised_message_falls_back_with_suggestions():
    response = respond("qwerty zzz")
    assert response.intent == "unknown"
    assert response.suggestions


def test_reorder_is_not_mistaken_for_orders():
    assert classify("reorder").name == "inventory"


def test_data_questions_use_workspace_context():
    inventory = respond("what should I reorder?", WORKSPACE).reply
    assert "4 of 5 SKUs" in inventory
    assert inventory.index("Reusable Freight Pallet") < inventory.index("Galvanised Roofing Sheet")
    assert "and 1 more" in inventory

    finance = respond("any overdue invoices?", WORKSPACE).reply
    assert "1 invoice is overdue" in finance
    assert "LKR 191.2K" in finance

    sales = respond("summarise sales", WORKSPACE).reply
    assert "6 orders worth LKR 2.20M" in sales

    assert "6 customers" in respond("how many customers", WORKSPACE).reply


def test_data_questions_without_context_ask_the_user_to_sign_in():
    for message in ("summarise sales", "what should I reorder", "overdue invoices", "how many customers"):
        assert "Sign in" in respond(message).reply


def test_empty_workspace_is_handled():
    empty = BusinessContext()
    assert "no orders" in respond("sales summary", empty).reply.lower()
    assert "No inventory" in respond("stock levels", empty).reply
    assert "No invoices" in respond("invoices", empty).reply


def test_all_stock_healthy():
    ctx = BusinessContext.model_validate({"inventory": {"skus": 3, "lowStock": []}})
    assert "nothing needs reordering" in respond("reorder", ctx).reply


def test_forecast_does_not_pretend_to_be_a_model():
    reply = respond("forecast revenue", WORKSPACE).reply
    assert "rule-based" in reply
    assert "LKR 545.4K" in reply


def test_insights_flag_real_problems():
    insights = generate_insights(WORKSPACE)
    titles = [insight.title for insight in insights]
    assert "4 items are at or below reorder level" in titles
    assert "1 overdue invoice to chase" in titles
    assert "1 order waiting on payment" in titles
    assert "1 draft invoice ready to issue" in titles
    assert any(insight.category == "Forecast" for insight in insights)
    low_stock = next(insight for insight in insights if "reorder level" in insight.title)
    assert "3 more also need restocking." in low_stock.description
    one_other = BusinessContext.model_validate(
        {"inventory": {"skus": 2, "lowStock": [{"name": "A", "stock": 1, "reorderLevel": 5}, {"name": "B", "stock": 2, "reorderLevel": 5}]}}
    )
    assert "1 more also needs restocking." in generate_insights(one_other)[0].description
    assert [insight.id for insight in insights] == [f"AI-{n}" for n in range(1, len(insights) + 1)]


def test_high_cancellation_rate_is_flagged_only_with_enough_orders():
    few = BusinessContext.model_validate({"orders": {"total": 3, "cancelled": 3}})
    assert not any("cancelled" in insight.title for insight in generate_insights(few))
    many = BusinessContext.model_validate({"orders": {"total": 10, "cancelled": 4}})
    assert any("40% of orders were cancelled" == insight.title for insight in generate_insights(many))


def test_empty_workspace_insight_invites_data_entry():
    insights = generate_insights(BusinessContext())
    assert len(insights) == 1
    assert insights[0].title == "Add data to unlock insights"


def test_healthy_workspace_reports_nothing_needs_attention():
    ctx = BusinessContext.model_validate({"customers": 2, "orders": {"total": 2, "fulfilled": 2}})
    assert generate_insights(ctx)[0].title == "Nothing needs attention"


def test_health_endpoint():
    assert client.get("/health").json() == {"status": "ok", "service": "ai"}


def test_chat_endpoint_accepts_camel_case_and_returns_camel_case():
    response = client.post(
        "/chat",
        json={
            "message": "any overdue invoices?",
            "sessionId": "abc",
            "context": {"invoices": {"total": 1, "overdue": 1, "overdueAmount": 5000}},
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["intent"] == "finance"
    assert "LKR 5.0K" in body["reply"]
    assert isinstance(body["suggestions"], list)


def test_chat_endpoint_works_without_context():
    response = client.post("/chat", json={"message": "hello"})
    assert response.status_code == 200
    assert response.json()["intent"] == "greeting"


@pytest.mark.parametrize("message", ["", "   ", "x" * 2001])
def test_chat_endpoint_rejects_bad_messages(message):
    assert client.post("/chat", json={"message": message}).status_code == 422


def test_insights_endpoint_returns_typed_list():
    response = client.post("/insights", json={"invoices": {"total": 1, "overdue": 1, "overdueAmount": 100}})
    assert response.status_code == 200
    body = response.json()
    assert body[0]["category"] == "Risk"
    assert set(body[0]) == {"id", "title", "description", "confidence", "category"}
