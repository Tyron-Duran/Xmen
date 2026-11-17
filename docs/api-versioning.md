# API Versioning & Evolution Strategy

> **Governance Principle:** All REST interfaces between System A (Store) and System B (FSM) follow **Semantic URI Versioning** with a strict backward compatibility policy.

---

## 1. Versioning Mechanism

- **URI Versioning Prefix:** All inter-service REST endpoints reside strictly under the `/api/v1/` namespace:
  - System A: `http://localhost:3000/api/v1/{resource}`
  - System B: `http://localhost:3100/api/v1/{resource}`
- **Header Propagation:** Responses include version metadata:
  - `X-API-Version: 1.0.0`
  - `API-Deprecated: false`

---

## 2. Backward Compatibility Rules (Minor & Patch Changes)

The following changes are classified as non-breaking and **MUST NOT** increment the major URI version:
1. **Adding new optional fields** to request payloads (must have default values or be optional in Zod/Pydantic).
2. **Adding new fields** to response payloads.
3. **Adding new endpoints** or HTTP methods.
4. **Adding non-mandatory query parameters**.
5. **Broadening accepted inputs** without removing existing valid formats.

Existing consumers of `/api/v1/` will continue functioning without modification.

---

## 3. Major Versioning for Breaking Changes

Any breaking change requires a new major version route (`/api/v2/`):

### Breaking Change Criteria:
- Removing or renaming an existing field in request or response schemas.
- Changing the data type of an existing field.
- Introducing a new mandatory request parameter or header.
- Changing authentication mechanisms or required OAuth scopes.
- Changing business status enum transitions (e.g., removing a valid `JobStatus`).

### Multi-Version Dual-Run Protocol:
1. When `/api/v2/` is released, `/api/v1/` remains fully operational.
2. The `/api/v1/` routes emit RFC 8594 deprecation headers:
   ```http
   Deprecation: true
   Sunset: Wed, 30 Jun 2027 23:59:59 GMT
   Link: </api/v2/installations>; rel="successor-version"
   ```
3. A minimum **6-month grace period** is enforced before any legacy major version is decommissioned.
