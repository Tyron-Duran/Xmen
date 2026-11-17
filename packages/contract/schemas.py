"""
Pydantic v2 Contract Models for Inter-Service Operations (OP-01 to OP-12)
Enforces extra='forbid' (extra field restriction) and strict string length limits.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Address(StrictModel):
    line1: str = Field(..., min_length=1, max_length=200)
    line2: Optional[str] = Field(None, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    postalCode: str = Field(..., min_length=1, max_length=10)


class OrderItemPayload(StrictModel):
    sku: str = Field(..., min_length=1, max_length=64)
    quantity: int = Field(..., ge=1, le=99)


class CreateInstallationRequest(StrictModel):
    orderNumber: str = Field(..., pattern=r"^GH-[0-9]{8}-[0-9]{6}$")
    customerName: str = Field(..., min_length=1, max_length=120)
    customerPhone: str = Field(..., pattern=r"^\+63[0-9]{8,10}$")
    customerEmail: str = Field(..., min_length=3, max_length=254)
    address: Address
    items: List[OrderItemPayload] = Field(..., min_length=1)
    preferredStart: str
    preferredEnd: str
    specialInstructions: Optional[str] = Field(None, max_length=500)


class InstallationJobResponse(StrictModel):
    jobNumber: str = Field(..., pattern=r"^JOB-[0-9]{8}-[0-9]{6}$")
    orderNumber: str
    status: Literal[
        "Pending Scheduling",
        "Scheduled",
        "In Progress",
        "Completed",
        "Cancelled",
        "Reschedule Required",
    ]
    technicianName: Optional[str] = None
    scheduledStart: Optional[str] = None
    scheduledEnd: Optional[str] = None
    items: List[OrderItemPayload]
    createdAt: str


class RescheduleRequest(StrictModel):
    requestedStart: str
    requestedEnd: str
    reason: str = Field(..., min_length=1, max_length=500)


class CancelInstallationRequest(StrictModel):
    reason: str = Field(..., min_length=1, max_length=500)
    cancelledBy: Literal["customer", "store_admin", "dispatcher", "admin"]


class ScheduleConfirmationWebhookRequest(StrictModel):
    jobNumber: str
    orderNumber: str
    technicianName: str = Field(..., min_length=1, max_length=120)
    scheduledStart: str
    scheduledEnd: str
    status: str


class StatusChangeWebhookRequest(StrictModel):
    jobNumber: str
    orderNumber: str
    status: str
    timestamp: str


class InstalledUnitPayload(StrictModel):
    sku: str = Field(..., min_length=1, max_length=64)
    serialNumber: str = Field(..., min_length=1, max_length=128)
    quantity: int = Field(1, ge=1)


class PartsAdjustmentPayload(StrictModel):
    sku: str = Field(..., min_length=1, max_length=64)
    quantity: int = Field(..., ge=1)
    type: Literal["used", "returned_unused", "replacement_used"]
    transactionId: str


class CompletionWebhookRequest(StrictModel):
    orderNumber: str
    jobNumber: str
    completedAt: str
    result: Literal["success", "partial", "failed"]
    installedUnits: List[InstalledUnitPayload]
    partsAdjustments: List[PartsAdjustmentPayload]
    notes: Optional[str] = Field(None, max_length=1000)


class InventoryAdjustmentWebhookRequest(StrictModel):
    transactionId: str
    sku: str = Field(..., min_length=1, max_length=64)
    onHandDelta: int
    reservedDelta: int
    reason: Literal[
        "reservation",
        "reservation_release",
        "install_use",
        "replacement_use",
        "direct_sale",
        "manual_adjustment",
    ]
    jobNumber: Optional[str] = None
    timestamp: str


class TechnicianFeedbackPayload(StrictModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)
    technicianTags: List[
        Literal[
            "on_time",
            "late",
            "professional",
            "unprofessional",
            "clean_work",
            "messy_work",
            "explained_clearly",
        ]
    ] = Field(default_factory=list)
    customerFirstName: str = Field(..., min_length=1, max_length=60)
    submittedAt: str


class ProofOfDeliveryPayload(StrictModel):
    jobNumber: str = Field(..., pattern=r"^JOB-[0-9]{8}-[0-9]{6}$")
    fileName: str = Field(..., min_length=1, max_length=255)
    fileSizeBytes: int = Field(..., ge=1, le=5 * 1024 * 1024)  # 5 MB cap
    mimeType: Literal["image/jpeg", "image/png", "image/webp"]
    storagePath: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=500)
