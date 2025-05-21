# Limits and Tiers (LIMITS_AND_TIERS.md)

This section describes how Morphik manages account tiers, usage limits, and related database structures. This is primarily relevant for cloud deployments.

## `core/models/tiers.py`

This file defines the available account tiers and their associated default limits.

-   **`AccountTier(str, Enum)`**:
    -   An enumeration defining the different account tiers:
        -   `FREE = "free"`
        -   `PRO = "pro"`
        -   `CUSTOM = "custom"`
        -   `SELF_HOSTED = "self_hosted"`
-   **`TIER_LIMITS: Dict[AccountTier, Dict[str, Any]]`**:
    -   A dictionary mapping each `AccountTier` to a dictionary of its specific limits.
    -   Limits are defined for various operations and resources, such as:
        -   `app_limit`: Maximum number of applications.
        -   `storage_file_limit`: Maximum number of files.
        -   `storage_size_limit_gb`: Maximum storage size in GB.
        -   `hourly_ingest_limit`, `monthly_ingest_limit`: Limits on ingestion operations.
        -   `hourly_query_limit`, `monthly_query_limit`: Limits on query operations.
        -   `graph_creation_limit`, `hourly_graph_query_limit`, `monthly_graph_query_limit`: Limits related to knowledge graphs.
        -   `cache_creation_limit`, `hourly_cache_query_limit`, `monthly_cache_query_limit`: Limits related to caching.
        -   `hourly_agent_limit`, `monthly_agent_limit`: Limits on agent calls.
    -   The `FREE` tier has restrictive limits.
    -   The `PRO` tier has more generous limits.
    -   The `CUSTOM` tier has default values that are expected to be overridden on a per-account basis.
    -   The `SELF_HOSTED` tier typically has `float("inf")` for limits, effectively meaning unlimited.
-   **`get_tier_limits(tier: AccountTier, custom_limits: Dict[str, Any] = None) -> Dict[str, Any]`**:
    -   A function that returns the limits for a specific account tier.
    -   If the tier is `CUSTOM` and `custom_limits` are provided, it merges the default custom limits with the provided ones.

## `core/models/user_limits.py`

This file defines Pydantic models for representing user usage and their specific limits configuration.

-   **`UserUsage(BaseModel)`**:
    -   Tracks a user's actual consumption of resources.
    -   Fields include counters for:
        -   Storage: `storage_file_count`, `storage_size_bytes`.
        -   Queries: `hourly_query_count`, `monthly_query_count`, and their respective `_reset` timestamps.
        -   Ingestion: `hourly_ingest_count`, `monthly_ingest_count`, and their respective `_reset` timestamps.
        -   Graphs: `graph_count`, `hourly_graph_query_count`, `monthly_graph_query_count`, and their respective `_reset` timestamps.
        -   Caches: `cache_count`, `hourly_cache_query_count`, `monthly_cache_query_count`, and their respective `_reset` timestamps.
-   **`UserLimits(BaseModel)`**:
    -   Stores the overall limits configuration for a user.
    -   Fields:
        -   `user_id: str`: The unique identifier for the user.
        -   `tier: AccountTier`: The user's current account tier (defaults to `FREE`).
        -   `created_at: datetime`, `updated_at: datetime`: Timestamps for record creation and last update.
        -   `usage: UserUsage`: An instance of `UserUsage` tracking their current consumption.
        -   `custom_limits: Optional[Dict[str, Any]]`: A dictionary for overriding default tier limits, primarily for the `CUSTOM` tier.
        -   `app_ids: list[str]`: A list of application IDs registered by this user.

## `core/database/user_limits_db.py`

This module handles the database interaction for storing and managing user limits and usage data.

-   **`UserLimitsModel(Base)`**:
    -   SQLAlchemy model for the `user_limits` table.
    -   **Columns**:
        -   `user_id: String` (Primary Key)
        -   `tier: String` (e.g., "free", "pro")
        -   `custom_limits: JSONB` (Nullable, for custom tier overrides)
        -   `usage: JSONB` (Stores usage counters like query counts, storage size, etc.)
        -   `app_ids: JSONB` (List of app IDs registered by the user)
        -   `stripe_customer_id: String` (Nullable)
        -   `stripe_subscription_id: String` (Nullable)
        -   `stripe_product_id: String` (Nullable)
        -   `subscription_status: String` (Nullable, e.g., "active", "canceled")
        -   `created_at: String` (ISO format)
        -   `updated_at: String` (ISO format)
    -   **Indexes**: Includes an index on the `tier` column.
-   **`UserLimitsDatabase`**:
    -   **`__init__(self, uri: str)`**: Initializes the database connection using an async engine.
    -   **`async def initialize(self) -> bool`**: Creates the `user_limits` table if it doesn't exist. It also includes a migration step to add Stripe-related columns (`stripe_customer_id`, `stripe_subscription_id`, `stripe_product_id`, `subscription_status`) if they are missing, ensuring backward compatibility.
    -   **`async def get_user_limits(self, user_id: str) -> Optional[Dict[str, Any]]`**: Retrieves the limits and usage data for a given `user_id`.
    -   **`async def create_user_limits(self, user_id: str, tier: str = "free") -> bool`**: Creates a new user limits record, defaulting to the "free" tier. Initializes usage counters and app_ids as empty/zero.
    -   **`async def update_user_tier(self, user_id: str, tier: str, custom_limits: Optional[Dict[str, Any]] = None) -> bool`**: Updates a user's tier and optionally their custom limits.
    -   **`async def update_subscription_info(self, user_id: str, subscription_data: Dict[str, Any]) -> bool`**: Updates Stripe-related subscription information for a user.
    -   **`async def register_app(self, user_id: str, app_id: str) -> bool`**: Adds an `app_id` to the user's list of registered apps. Ensures the `app_id` is unique within the list.
    -   **`async def update_usage(self, user_id: str, usage_type: str, increment: int = 1) -> bool`**:
        -   Increments the specified `usage_type` counter for the user.
        -   Handles hourly and monthly reset logic for time-windowed limits (e.g., `hourly_query_count`, `monthly_ingest_count`). If the current time is past the reset period, the counter is reset before incrementing.
        -   Supported `usage_type`s: "query", "ingest", "storage_file", "storage_size", "graph", "cache", "agent".
        -   Ensures SQLAlchemy detects changes to the JSONB `usage` field by creating a new dictionary.

## `core/limits_utils.py`

This module provides utility functions for checking and incrementing user limits, intended to be used by API endpoints.

-   **`async def check_and_increment_limits(auth: AuthContext, limit_type: str, value: int = 1, document_id: str = None) -> None`**:
    -   Central function to enforce usage limits.
    -   Skips limit checking if `settings.MODE` is "self_hosted" or if `auth.user_id` is not available.
    -   Initializes `UserService` if not already done.
    -   Retrieves user's current tier and limits. If the user record doesn't exist, it creates one (defaulting to the FREE tier).
    -   **Free Tier Enforcement**: If the user is on the `FREE` tier, it calls `user_service.check_limit` to see if the operation (considering the `value` to be added) would exceed any defined limits for the `limit_type`.
        -   If a limit is exceeded, it raises an `HTTPException` (status code 429) with a relevant error message.
    -   **Non-Free Tiers & Stripe Metering**: If the user is on a paid tier (`PRO`, `CUSTOM`) and the application is in "cloud" mode:
        -   It does *not* enforce hard limits (allowing usage beyond typical thresholds).
        -   For "ingest" operations, if a `stripe_customer_id` is present for the user, it attempts to send a metering event to Stripe using `stripe.billing.MeterEvent.create`. This is for usage-based billing. The `increment` value (e.g., number of pages for ingest) is reported.
    -   **Usage Recording**: Regardless of tier (unless self-hosted), it calls `user_service.record_usage` to update the usage counters in the database. This happens even if limits are not strictly enforced for paid tiers, allowing for tracking and potential future billing.
    -   The `document_id` is passed to `record_usage` for Stripe metering events, providing a unique identifier for the event.