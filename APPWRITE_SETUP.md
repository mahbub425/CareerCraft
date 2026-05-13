# Appwrite Setup

Create a `.env` file from `.env.example` and fill your Appwrite values.

## Required Appwrite Platform

Add your local development URL as a Web platform:

```text
http://127.0.0.1:5173
```

If you use Vite's default localhost URL, add it too:

```text
http://localhost:5173
```

Email verification redirects users back to:

```text
http://127.0.0.1:5173/verify-email
http://localhost:5173/verify-email
```

Appwrite validates the hostname against your Web platforms, so the host you use in the browser must be listed in the Appwrite Console.

## Auth Email Verification

Registration creates a temporary session, sends an Appwrite email verification link, then logs the user out. The verification link opens `/verify-email` and completes verification with Appwrite's `userId` and `secret` query parameters.

Make sure your Appwrite project can send email. On Appwrite Cloud this is handled by Appwrite; on self-hosted Appwrite, configure SMTP first.

## Database

Create one database and set its ID in:

```text
VITE_APPWRITE_DATABASE_ID
```

## Collections

### `cvs`

Set collection ID in `VITE_APPWRITE_CVS_COLLECTION_ID`.

Attributes:

- `user_id` string, required
- `title` string, required
- `category` string, required
- `template_id` string, required
- `cv_data` string, required
- `section_order` string, required
- `created_at` datetime or string
- `updated_at` datetime or string

Recommended permissions:

- Create: Users
- Read: Users
- Update: Users
- Delete: Users

### `templates`

Set collection ID in `VITE_APPWRITE_TEMPLATES_COLLECTION_ID`.

Attributes:

- `name` string, required
- `category` string, required
- `preview_image` string
- `layout_config` string
- `is_free` boolean
- `access_type` string/enum: `free` or `premium`
- `status` string
- `created_at` datetime or string

### `categories`

Set collection ID in `VITE_APPWRITE_CATEGORIES_COLLECTION_ID`.

Attributes:

- `name` string, required
- `description` string
- `status` string

### `download_history`

Set collection ID in `VITE_APPWRITE_DOWNLOADS_COLLECTION_ID`.

Attributes:

- `user_id` string, required
- `cv_id` string, required
- `format` string, required
- `downloaded_at` datetime or string

### `plans`

Attributes:

- `name` string, required
- `price_bdt` integer, required
- `duration_days` integer
- `ai_credits` integer
- `download_limit` integer (`-1` means unlimited)
- `premium_templates` boolean
- `priority_support` boolean
- `status` string/enum: `Active`, `Inactive`
- `sort_order` integer
- `features` string

### `subscriptions`

Attributes:

- `user_id` string, required
- `plan_id` string, required
- `plan_name` string, required
- `status` string/enum: `Active`, `Expired`, `Cancelled`
- `starts_at` datetime
- `expires_at` datetime
- `ai_credits_used` integer
- `downloads_used` integer

### `payment_requests`

Attributes:

- `user_id` string, required
- `user_email` string, required
- `user_name` string
- `plan_id` string, required
- `plan_name` string, required
- `amount_bdt` integer, required
- `bkash_number` string, required
- `sender_number` string, required
- `transaction_id` string, required
- `screenshot_url` string
- `status` string/enum: `pending`, `approved`, `rejected`
- `admin_note` string
- `submitted_at` datetime
- `reviewed_at` datetime

### `billing_settings`

Attributes:

- `key` string, required
- `free_ai_credits` integer
- `free_download_limit` integer
- `bkash_number` string
- `payment_instruction` string
- `updated_at` datetime

## Storage

Create a `payment_proofs` bucket for bKash screenshots.

Recommended permissions:

- Create: Users
- Read/Update/Delete: Admin label

Use file security so each uploaded proof is readable by the submitting user and admin.

## Resend Payment Emails

Create a Resend account at `https://resend.com/`, verify your sending domain, and add the DNS records Resend gives you. Then set:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
ADMIN_NOTIFICATION_EMAIL
APP_URL
```

Payment submitted, approved, and rejected emails are sent through `/api/email/payment-status`.

## Current Integration Status

- Login/register/logout uses Appwrite Account.
- Dashboard attempts to read/save/delete CV drafts in Appwrite.
- If Appwrite env or permissions are missing, the UI shows the backend error and keeps a local fallback draft.
- Admin template persistence service exists in `src/backend/templateService.ts`; the Admin page UI is ready for wiring.
