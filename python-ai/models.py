from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Accepts and emits camelCase JSON so it matches the Spring Boot backend's payloads."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class LowStockItem(CamelModel):
    name: str
    stock: int = 0
    reorder_level: int = 0


class OrderStats(CamelModel):
    total: int = 0
    processing: int = 0
    fulfilled: int = 0
    pending_payment: int = 0
    cancelled: int = 0
    value: float = 0
    open_value: float = 0


class InvoiceStats(CamelModel):
    total: int = 0
    paid: int = 0
    outstanding: int = 0
    overdue: int = 0
    draft: int = 0
    paid_amount: float = 0
    outstanding_amount: float = 0
    overdue_amount: float = 0
    draft_amount: float = 0


class InventoryStats(CamelModel):
    skus: int = 0
    low_stock: list[LowStockItem] = Field(default_factory=list)


class BusinessContext(CamelModel):
    """A snapshot of the signed-in user's workspace, computed by the backend."""

    customers: int = 0
    orders: OrderStats = Field(default_factory=OrderStats)
    invoices: InvoiceStats = Field(default_factory=InvoiceStats)
    inventory: InventoryStats = Field(default_factory=InventoryStats)


class ChatRequest(CamelModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, str_strip_whitespace=True)

    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = None
    # Only present for authenticated users; anonymous visitors get general answers.
    context: BusinessContext | None = None


class ChatResponse(CamelModel):
    reply: str
    intent: str
    suggestions: list[str] = Field(default_factory=list)


class Insight(CamelModel):
    id: str
    title: str
    description: str
    confidence: int
    category: Literal["Forecast", "Risk", "Opportunity", "Automation"]
