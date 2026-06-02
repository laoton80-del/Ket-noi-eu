# VIONA WAVE 3B — Travel Local Assistance Discovery & Navigation Model

**Pack:** `VIONA.WAVE_3B.TRAVEL_LOCAL_ASSISTANCE_DISCOVERY_AND_NAVIGATION_MODEL.1`

## Protocol check

Aligned with `VIONA_OPERATING_PROTOCOL.md` — Class A UI; preview/demo labeling; no fake booking, fixer confirmation, dispatch, payment, or in-app live GPS tracking.

## Product meaning

Travel **Hỗ trợ địa phương** = local services around destination, contextual nearby support, local guides preview, map/navigation handoff, Local hub handoff for deeper requests.

**Not:** confirmed fixer, guaranteed person, booking, payment, dispatch, live tracking.

## Surface elements

| Element | Purpose |
|---------|---------|
| Search action | `Tìm địa điểm cần đến` → OSM external search (preview handoff) |
| Category chips (8) | Browse service types on cinematic map preview |
| Demo preview list (3) | Static nearby examples, clearly `demo` |
| Handoff row | Chỉ đường · Mở bản đồ · Mở Local guides · Gửi yêu cầu hỗ trợ |
| Primary CTA | Mở Local guides → existing `LocalFixer` route |
| Safety line | Preserved verbatim |

## Navigation behavior

- **Search:** `openOsmSearchQuery` with destination query (external, no fake in-app results)
- **Chỉ đường / Mở bản đồ:** `openDirectionsExternally` only when GPS consent; else safe preview alert
- **Mở Local guides / Gửi yêu cầu hỗ trợ:** `navigation.navigate('LocalFixer')` (existing handler)

## testIDs

- `travel-local-discovery-search-action`
- `travel-local-discovery-category-row`
- `travel-local-discovery-category-{id}`
- `travel-local-discovery-preview-list`
- `travel-local-discovery-handoff-row`
- `travel-local-discovery-open-guides-cta`

## Evidence

`docs/design/evidence/wave-3b-travel-local-assistance-discovery-and-navigation-model/`
