# Kiray Telegram Bot — Setup

The bot lives in `api/telegram-webhook.js`. Vercel automatically turns any file
in the `/api` folder into a serverless function — no other config needed.
Listings data is shared between the app and the bot via `src/data/listings.js`.

## 1. Set environment variables on Vercel

Vercel dashboard → your project → **Settings → Environment Variables** → add:

| Name                    | Value                                          |
|-------------------------|------------------------------------------------|
| `TELEGRAM_BOT_TOKEN`    | your token from @BotFather (the NEW one, after revoking the old) |
| `TELEGRAM_SECRET_TOKEN` | any random string you invent, e.g. `kiray-7f3k9x2m`             |
| `KIRAY_APP_URL`         | (optional) your app URL, e.g. `https://kiray.vercel.app` — adds an "Open Kiray" button to bot replies |

## 2. Deploy

From this folder, in Command Prompt:

    git add .
    git commit -m "Add Telegram bot"
    git push

Wait for Vercel to finish deploying.

## 3. Register the webhook (one time, in Command Prompt, ONE line)

Replace the three UPPERCASE parts with your real values:

    curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://YOUR-APP.vercel.app/api/telegram-webhook&secret_token=YOUR_SECRET"

- `YOUR_TOKEN` = bot token (no < > brackets)
- `YOUR-APP.vercel.app` = your Vercel domain
- `YOUR_SECRET` = the exact same string you set as TELEGRAM_SECRET_TOKEN

Expected reply: {"ok":true,"result":true,"description":"Webhook was set"}

## 4. Test

Message your bot on Telegram:

- `/start`
- `/listings` (everything)
- `/listings Addis Ababa` (by city)
- `/listings Bole` (by neighbourhood)
- `/listings shop` (by type)

## Troubleshooting

Check webhook status:

    curl https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo

Look at `last_error_message` in the reply. Also check
Vercel dashboard → your project → **Logs** to see the function's console output.
