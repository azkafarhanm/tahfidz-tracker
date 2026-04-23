import logging
import pandas as pd
import os
import json
import re
from datetime import datetime

from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, CommandHandler, filters, ContextTypes

# ENV VARIABLES
BOT_TOKEN = os.getenv("BOT_TOKEN")
MY_ID = os.getenv("MY_ID")
GEMINI_KEY = os.getenv("GEMINI_KEY")

if not BOT_TOKEN or not MY_ID or not GEMINI_KEY:
    raise ValueError("Missing environment variables")

MY_ID = int(MY_ID)

# Gemini
from google import genai

# SETTINGS
CSV_PATH = "memorization_data.csv"

logging.basicConfig(level=logging.INFO)

client = genai.Client(api_key=GEMINI_KEY)

# --- 1. SAFE JSON EXTRACTOR ---
def extract_json(text):
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except:
        pass
    return None

# --- 2. AI HANDLER ---
async def handle_ai_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != MY_ID:
        return

    user_text = update.message.text

    prompt = f"""
    Extract structured data from this Tahfidz report:
    "{user_text}"

    Respond ONLY in JSON:
    {{
      "action": "add" OR "view",
      "student": "...",
      "surah": "...",
      "verses": "...",
      "notes": "..."
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )

        data = extract_json(response.text)

        if not data:
            raise ValueError("Invalid JSON from AI")

        # --- VIEW ---
        if data.get("action") == "view":
            await view_data(update, context)
            return

        # --- ADD ---
        new_entry = {
            "Date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "Student": data.get("student", "Unknown"),
            "Surah": data.get("surah", "Unknown"),
            "Verses": data.get("verses", "Unknown"),
            "Notes": data.get("notes", "")
        }

        if os.path.exists(CSV_PATH):
            df = pd.read_csv(CSV_PATH)
        else:
            df = pd.DataFrame(columns=new_entry.keys())

        df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
        df.to_csv(CSV_PATH, index=False)

        await update.message.reply_text(
            f"✅ Recorded:\n👤 {new_entry['Student']}\n📖 {new_entry['Surah']} ({new_entry['Verses']})"
        )

    except Exception as e:
        logging.error(f"AI Error: {e}")

        # ✅ FALLBACK (no AI)
        fallback = re.search(
            r"(\w+)\s+(read|recited|finished)\s+(?:surah\s+)?([\w-]+)\s+(\d+)[-to ]+(\d+)",
            user_text.lower()
        )

        if fallback:
            name, _, surah, start, end = fallback.groups()

            new_entry = {
                "Date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "Student": name.capitalize(),
                "Surah": surah.capitalize(),
                "Verses": f"{start}-{end}",
                "Notes": "Auto parsed"
            }

            if os.path.exists(CSV_PATH):
                df = pd.read_csv(CSV_PATH)
            else:
                df = pd.DataFrame(columns=new_entry.keys())

            df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
            df.to_csv(CSV_PATH, index=False)

            await update.message.reply_text("✅ Recorded (fallback mode)!")
        else:
            await update.message.reply_text(
                "❌ Try format: Ahmad read Al-Mulk 1-10"
            )

# --- 3. VIEW DATA ---
async def view_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not os.path.exists(CSV_PATH):
        await update.message.reply_text("No data found!")
        return

    df = pd.read_csv(CSV_PATH)

    text = "📊 Recent Records:\n\n"
    for _, row in df.tail(5).iterrows():
        text += f"🔹 {row['Student']} | {row['Surah']} | {row['Verses']}\n"

    await update.message.reply_text(text)

# --- 4. MAIN ---
if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_ai_message))
    app.add_handler(CommandHandler("view", view_data))

    print("🚀 Bot is running...")
    app.run_polling()