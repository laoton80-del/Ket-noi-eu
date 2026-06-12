# Clean rebase after ReferenceLab merge — summary

**Pack:** `PACK_TRAVEL_REBASE_AFTER_REFERENCE_LAB_MERGE`
**Branch:** `viona/travel-multi-scene-restore`
**Rebased onto:** `origin/master` @ `1979b99`
**HEAD after rebase:** `05f6060`

## Rebase

- Conflicts: **none**
- 18 Travel commits replayed on top of ReferenceLab fix merge
- Key commits preserved (new SHAs):
  - `6d4b946` feat(travel): wire location master hero v2 assets
  - `65c6f12` fix(travel): scope location masters to hero only
  - `05f6060` fix(travel): polish responsive crop for location master heroes

## Scope vs origin/master

- `App.tsx`: **absent** from Travel diff (inherits ReferenceLab fix from master base)
- `src/navigation/referenceLabStackScreens.tsx`: **absent** from Travel diff
- Primary code change: `src/screens/b2c/TravelScreen.tsx` + Travel assets + evidence

## Runtime QA note

- **No App.tsx workaround used** — branch App.tsx matches master ReferenceLab fix (`getReferenceLabStackScreens`)
- Expo port: **8291** (`npx expo start --web --clear`)
