# Goal Description
Make the "All Pins" aggregation private by default, with a setting in the "Saved Pins" screen to allow users to toggle its visibility for other users viewing their profile.

## User Review Required
> [!IMPORTANT]
> This requires a database schema change. We will need to add a new column to the `profiles` table to store this preference. Please review the SQL migration below. You will need to run this SQL in your Supabase SQL Editor.

## Proposed Changes

### Database Migration
Run the following SQL in your Supabase project:
```sql
ALTER TABLE profiles ADD COLUMN all_saves_private BOOLEAN DEFAULT TRUE;
```

### `src/types/database.ts`
- Update the `profiles` type definitions (`Row`, `Insert`, `Update`) to include `all_saves_private: boolean;`.

### `src/components/profile/ProfileView.tsx`
- Conditionally render the "All Pins" card. Only show it if:
  - The viewing user is the current user (`isCurrentUser === true`), OR
  - The profile being viewed has `all_saves_private` set to `false`.

### `app/saved-pins.tsx`
- Add a toggle or switch in the header/top-section to let the user change the privacy setting.
- The toggle will update the `all_saves_private` field on their profile in the `profiles` table.
- This UI will only be visible if the current logged-in user is viewing their own saved pins.

## Verification Plan
- Check if "All Pins" is hidden when viewing another user's profile whose saves are private.
- Verify the toggle successfully updates the database and reflects in the UI.
