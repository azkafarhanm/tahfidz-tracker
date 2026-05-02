import logging
import pandas as pd
import os
import json
import re
from datetime import datetime

from telegram import Update
from telegram.error import NetworkError, RetryAfter, TimedOut
from telegram.ext import ApplicationBuilder, MessageHandler, CommandHandler, filters, ContextTypes

# ENV VARIABLES
try:
    import config
except ImportError:
    config = None


def get_setting(name, default=None):
    return os.getenv(name) or getattr(config, name, default)


BOT_TOKEN = get_setting("BOT_TOKEN")
MY_ID = get_setting("MY_ID")
GEMINI_KEY = get_setting("GEMINI_KEY")

if not BOT_TOKEN or not MY_ID:
    raise ValueError("Missing environment variables")

MY_ID = int(MY_ID)

# Gemini
from google import genai
client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None

# SETTINGS
CSV_PATH = "memorization_data.csv"
DATA_COLUMNS = ["Date", "Student", "Surah", "Verses", "Notes"]
HELP_TEXT = (
    "📖 Tahfidz Tracker Bot\n\n"
    "Examples:\n"
    "add Ahmad Al-Mulk 1-10 lancar\n"
    "Ahmad read Al-Mulk 1-10\n"
    "Fadlan recited Al-Kautsar 10 ayat\n"
    "edit Ahmad to Yasin 1-10\n"
    "delete Ahmad\n"
    "view records\n"
    "show stats\n\n"
    "Commands:\n"
    "/add\n/view\n/stats\n/export\n/delete\n/edit\n/cancel"
)

logging.basicConfig(level=logging.INFO)

# ---------------- CORE FUNCTIONS ---------------- #

def is_authorized(update):
    return update.effective_user and update.effective_user.id == MY_ID


async def safe_reply_text(update: Update, text: str):
    try:
        await update.message.reply_text(text)
    except RetryAfter as e:
        logging.warning(f"Telegram rate limit hit: retry after {e.retry_after}s")
    except (TimedOut, NetworkError) as e:
        logging.warning(f"Telegram reply failed due to network issue: {e}")


async def safe_reply_document(update: Update, document):
    try:
        await update.message.reply_document(document=document)
    except RetryAfter as e:
        logging.warning(f"Telegram rate limit hit while sending document: retry after {e.retry_after}s")
    except (TimedOut, NetworkError) as e:
        logging.warning(f"Telegram document reply failed due to network issue: {e}")


def normalize_spaces(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_name(value):
    return normalize_spaces(value).title()


def normalize_verses(value):
    value = normalize_spaces(value)
    return re.sub(r"\s*-\s*", "-", value)


def clean_surah(value):
    value = normalize_spaces(value)
    return re.sub(r"^(surah|sura)\s+", "", value, flags=re.IGNORECASE)


def load_records():
    if not os.path.exists(CSV_PATH):
        return pd.DataFrame(columns=DATA_COLUMNS)

    df = pd.read_csv(CSV_PATH)

    for column in DATA_COLUMNS:
        if column not in df.columns:
            df[column] = ""

    df = df[DATA_COLUMNS].fillna("")
    return df


def save_records(df):
    df = df.copy()

    for column in DATA_COLUMNS:
        if column not in df.columns:
            df[column] = ""

    df = df[DATA_COLUMNS].fillna("")
    df.to_csv(CSV_PATH, index=False)


def add_record(data):
    df = load_records()

    new_entry = {
        "Date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "Student": normalize_name(data.get("student", "Unknown")),
        "Surah": clean_surah(data.get("surah", "Unknown")),
        "Verses": normalize_verses(data.get("verses", "Unknown")),
        "Notes": normalize_spaces(data.get("notes", ""))
    }

    df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
    save_records(df)

    return f"✅ Added: {new_entry['Student']} - {new_entry['Surah']} ({new_entry['Verses']})"


def view_records():
    df = load_records()

    if df.empty:
        return "No data"

    text = "📊 Last 10 Records:\n\n"

    for _, row in df.tail(10).iterrows():
        notes = f" | {row['Notes']}" if normalize_spaces(row["Notes"]) else ""
        text += f"• {row['Date']} | {row['Student']} | {row['Surah']} | {row['Verses']}{notes}\n"

    return text


def delete_records(target):
    target = normalize_spaces(target)
    df = load_records()

    if df.empty:
        return "No data"

    if not target:
        return "❌ Try: /delete all, /delete last, /delete Ahmad, or /delete Ahmad 2"

    lowered = target.lower()

    if lowered == "all":
        save_records(pd.DataFrame(columns=DATA_COLUMNS))
        return "🗑 Deleted all records"

    if lowered == "last":
        last = df.iloc[-1]
        df = df.drop(df.index[-1])
        save_records(df)
        return f"🗑 Deleted last record: {last['Student']} - {last['Surah']} ({last['Verses']})"

    match = re.search(r"^(.+?)\s+(\d+)$", target)
    count = 0
    student = target

    if match:
        student = match.group(1)
        count = int(match.group(2))

    student = normalize_name(student)
    matches = df[df["Student"].str.lower() == student.lower()]

    if matches.empty:
        return f"❌ No record found for {student}"

    indexes_to_delete = matches.index if count == 0 else matches.tail(count).index
    deleted_count = len(indexes_to_delete)

    df = df.drop(indexes_to_delete)
    save_records(df)

    if count == 0:
        return f"🗑 Deleted all records for {student} ({deleted_count})"

    return f"🗑 Deleted last {deleted_count} record(s) for {student}"


def delete_last(student):
    return delete_records(student)


def edit_last(student, new_surah=None, new_verses=None, notes=None):
    student = normalize_name(student)
    new_surah = clean_surah(new_surah)
    new_verses = normalize_verses(new_verses)
    notes = normalize_spaces(notes)

    df = load_records()

    if df.empty:
        return "No data"

    if not student:
        return "❌ Try: /edit Ahmad Yasin 1-10 lancar"

    matches = df[df["Student"].str.lower() == student.lower()]

    if matches.empty:
        return f"❌ No record found for {student}"

    last_index = matches.index[-1]

    if new_surah:
        df.loc[last_index, "Surah"] = new_surah

    if new_verses:
        df.loc[last_index, "Verses"] = new_verses

    if notes:
        df.loc[last_index, "Notes"] = notes

    if not new_surah and not new_verses and not notes:
        return "❌ Try: /edit Ahmad Yasin 1-10 lancar or /edit Ahmad lancar"

    save_records(df)

    row = df.loc[last_index]
    return f"✏️ Updated: {row['Student']} - {row['Surah']} ({row['Verses']}) {row['Notes']}".strip()


def get_stats():
    df = load_records()

    if df.empty:
        return "No data"

    text = f"📊 Stats\n\nTotal Records: {len(df)}\nStudents: {df['Student'].nunique()}\n"

    top = df["Student"].value_counts().head(3)
    text += "\n🏆 Top Students:\n"

    for name, count in top.items():
        text += f"{name} — {count}\n"

    return text

# ---------------- COMMANDS ---------------- #

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    await safe_reply_text(update, HELP_TEXT)


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    await safe_reply_text(update, HELP_TEXT)


async def view_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    await safe_reply_text(update, view_records())


async def stats_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    await safe_reply_text(update, get_stats())


async def export_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    if not os.path.exists(CSV_PATH):
        await safe_reply_text(update, "No data to export!")
        return

    try:
        df = pd.read_csv(CSV_PATH)
        file_path = "memorization_data.xlsx"
        df.to_excel(file_path, index=False)

        with open(file_path, "rb") as f:
            await safe_reply_document(update, f)
    except Exception as e:
        logging.error(f"Export failed: {e}")
        await safe_reply_text(update, "❌ Export failed. Make sure openpyxl is installed.")


async def delete_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    target = " ".join(context.args)

    if not target:
        await start_delete_flow(update, context)
        return

    context.user_data.clear()
    context.user_data["step"] = "confirm_delete"
    context.user_data["delete_target"] = target
    await safe_reply_text(update, f"⚠️ Delete `{target}`? Are you sure? (yes/no)")


async def edit_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    text = " ".join(context.args)

    if not text:
        await start_edit_flow(update, context)
        return

    data = fallback_parse(f"edit {text}")

    if not data:
        await safe_reply_text(update, "❌ Try: /edit Ahmad Yasin 1-10 lancar or /edit Ahmad lancar")
        return

    await safe_reply_text(update, run_action(data))


async def add_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    text = " ".join(context.args)

    if not text:
        await start_add_flow(update, context)
        return

    data = fallback_parse(f"add {text}")

    if not data:
        await safe_reply_text(update, "❌ Try: /add Ahmad Al-Mulk 1-10 lancar")
        return

    await safe_reply_text(update, run_action(data))


async def cancel_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    if context.user_data.get("step"):
        context.user_data.clear()
        await safe_reply_text(update, "✅ Cancelled.")
        return

    await safe_reply_text(update, "No active flow.")


async def start_add_flow(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    context.user_data["flow"] = "add"
    context.user_data["step"] = "ask_student"
    context.user_data["record"] = {}
    await safe_reply_text(update, "👤 Who is the student?")


async def start_delete_flow(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    context.user_data["flow"] = "delete"
    context.user_data["step"] = "ask_delete_target"
    await safe_reply_text(update, "🗑 Delete what?\n\nOptions: last, all, or student name")


async def start_edit_flow(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    context.user_data["flow"] = "edit"
    context.user_data["step"] = "ask_edit_student"
    context.user_data["edit"] = {}
    await safe_reply_text(update, "👤 Who to edit?")


def is_skip(value):
    return normalize_spaces(value).lower() in {"skip", "-", "no", "none", "kosong"}


async def continue_flow(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = normalize_spaces(update.message.text)
    step = context.user_data.get("step")

    if text.lower() == "cancel":
        context.user_data.clear()
        await safe_reply_text(update, "✅ Cancelled.")
        return True

    if step == "ask_student":
        if not text:
            await safe_reply_text(update, "👤 Enter student name:")
            return True

        context.user_data["record"]["student"] = text
        context.user_data["step"] = "ask_surah"
        await safe_reply_text(update, "📖 Which surah?")
        return True

    if step == "ask_surah":
        if not text:
            await safe_reply_text(update, "📖 Enter surah:")
            return True

        context.user_data["record"]["surah"] = text
        context.user_data["step"] = "ask_verses"
        await safe_reply_text(update, "🔢 Verses? Example: 1-10")
        return True

    if step == "ask_verses":
        if not re.search(r"\d+", text):
            await safe_reply_text(update, "🔢 Enter verses with numbers, e.g. 1-10 or 10 ayat:")
            return True

        context.user_data["record"]["verses"] = text
        context.user_data["step"] = "ask_notes"
        await safe_reply_text(update, "📝 Any notes? Type skip if none.")
        return True

    if step == "ask_notes":
        record = context.user_data.get("record", {})
        record["notes"] = "" if is_skip(text) else text
        result = add_record(record)
        context.user_data.clear()
        await safe_reply_text(update, f"{result}\n✅ Record saved!")
        return True

    if step == "ask_delete_target":
        if not text:
            await safe_reply_text(update, "🗑 Delete what? Type last, all, or a student name.")
            return True

        context.user_data["delete_target"] = text
        context.user_data["step"] = "confirm_delete"
        await safe_reply_text(update, f"⚠️ Delete `{text}`? Are you sure? (yes/no)")
        return True

    if step == "confirm_delete":
        answer = text.lower()

        if answer not in {"yes", "y", "no", "n"}:
            await safe_reply_text(update, "⚠️ Please answer yes or no.")
            return True

        if answer in {"no", "n"}:
            context.user_data.clear()
            await safe_reply_text(update, "✅ Delete cancelled.")
            return True

        target = context.user_data.get("delete_target")
        result = delete_records(target)
        context.user_data.clear()
        await safe_reply_text(update, result)
        return True

    if step == "ask_edit_student":
        if not text:
            await safe_reply_text(update, "👤 Enter student name:")
            return True

        context.user_data["edit"]["student"] = text
        context.user_data["step"] = "ask_edit_surah"
        await safe_reply_text(update, "📖 New surah? Type skip to keep old value.")
        return True

    if step == "ask_edit_surah":
        context.user_data["edit"]["surah"] = "" if is_skip(text) else text
        context.user_data["step"] = "ask_edit_verses"
        await safe_reply_text(update, "🔢 New verses? Type skip to keep old value.")
        return True

    if step == "ask_edit_verses":
        if text and not is_skip(text) and not re.search(r"\d+", text):
            await safe_reply_text(update, "🔢 Enter verses with numbers, e.g. 1-10, or type skip.")
            return True

        context.user_data["edit"]["verses"] = "" if is_skip(text) else text
        context.user_data["step"] = "ask_edit_notes"
        await safe_reply_text(update, "📝 New notes? Type skip to keep old value.")
        return True

    if step == "ask_edit_notes":
        edit = context.user_data.get("edit", {})
        edit["notes"] = "" if is_skip(text) else text
        result = edit_last(
            edit.get("student"),
            edit.get("surah"),
            edit.get("verses"),
            edit.get("notes"),
        )
        context.user_data.clear()
        await safe_reply_text(update, result)
        return True

    return False

# ---------------- AI + FALLBACK ---------------- #

def extract_json(text):
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
            return None
    return None


def fallback_parse(text):
    text = normalize_spaces(text)
    lowered = text.lower()

    # ADD
    match = re.search(
        r"^(.+?)\s+(read|recited|finished|memorized|murojaah|murajaah)\s+(?:surah\s+)?(.+?)\s+(\d+(?:\s*-\s*\d+)?(?:\s*(?:ayat|ayah|verse|verses))?)(?:\s+(.+))?$",
        text,
        re.IGNORECASE,
    )
    if match:
        return {
            "action": "add",
            "student": normalize_name(match.group(1)),
            "surah": clean_surah(match.group(3)),
            "verses": normalize_verses(match.group(4)),
            "notes": normalize_spaces(match.group(5))
        }

    # ADD sentence: "add Afdhal Al-Mulk 1-10 lancar"
    match = re.search(
        r"^add\s+(\S+)\s+(.+?)\s+(\d+(?:\s*-\s*\d+)?(?:\s*(?:ayat|ayah|verse|verses))?)(?:\s+(.+))?$",
        text,
        re.IGNORECASE,
    )
    if match:
        return {
            "action": "add",
            "student": normalize_name(match.group(1)),
            "surah": clean_surah(match.group(2)),
            "verses": normalize_verses(match.group(3)),
            "notes": normalize_spaces(match.group(4))
        }

    # ADD without a verb: "Afdhal Al-Mulk 1-10 lancar"
    match = re.search(
        r"^(\S+)\s+(.+?)\s+(\d+(?:\s*-\s*\d+)?(?:\s*(?:ayat|ayah|verse|verses))?)(?:\s+(.+))?$",
        text,
        re.IGNORECASE,
    )
    if match and not lowered.startswith(("/", "add ", "edit ", "delete ", "remove ")):
        return {
            "action": "add",
            "student": normalize_name(match.group(1)),
            "surah": clean_surah(match.group(2)),
            "verses": normalize_verses(match.group(3)),
            "notes": normalize_spaces(match.group(4))
        }

    # EDIT
    match = re.search(
        r"^edit\s+(.+?)\s+to\s+(?:surah\s+)?(.+?)\s+(\d+(?:\s*-\s*\d+)?(?:\s*(?:ayat|ayah|verse|verses))?)(?:\s+(.+))?$",
        text,
        re.IGNORECASE,
    )
    if not match:
        match = re.search(
            r"^edit\s+(\S+)\s+(?:surah\s+)?(.+?)\s+(\d+(?:\s*-\s*\d+)?(?:\s*(?:ayat|ayah|verse|verses))?)(?:\s+(.+))?$",
            text,
            re.IGNORECASE,
        )
    if match:
        return {
            "action": "edit",
            "student": normalize_name(match.group(1)),
            "surah": clean_surah(match.group(2)),
            "verses": normalize_verses(match.group(3)),
            "notes": normalize_spaces(match.group(4))
        }

    # EDIT NOTES ONLY
    match = re.search(r"^edit\s+(\S+)\s+(.+?)$", text, re.IGNORECASE)
    if match:
        return {
            "action": "edit",
            "student": normalize_name(match.group(1)),
            "notes": normalize_spaces(match.group(2))
        }

    # DELETE
    match = re.search(r"^(delete|remove)\s+(.+?)$", text, re.IGNORECASE)
    if match:
        return {
            "action": "delete",
            "target": normalize_spaces(match.group(2))
        }

    # VIEW
    if re.search(r"^/?(view|show|list)(\s+(records|data|last|recent))?$", lowered):
        return {"action": "view"}

    # STATS
    if re.search(r"^/?(stats|statistics|report|summary|show stats)$", lowered):
        return {"action": "stats"}

    return None


def parse_with_ai(user_text):
    if not client:
        return None

    prompt = f"""
You are a strict JSON data extractor for a Tahfidz (Qur'an memorization) tracker.

Your job:
Extract structured data from ANY natural sentence.

RULES (VERY IMPORTANT):
- Output ONLY valid JSON
- DO NOT add explanation
- DO NOT add markdown
- DO NOT add text before or after JSON
- Always include "action"
- NEVER ignore notes
- NEVER lose words
- EVERYTHING extra MUST go into "notes"

Available actions:
- add
- view
- delete
- edit
- stats

FORMAT:

For ADD:
{{"action":"add","student":"Name","surah":"Surah","verses":"Range","notes":""}}

ADD extraction rules:
- Student is ALWAYS the first word when the input is a simple tracker entry.
- Surah is the word(s) after student that represent a Quran surah.
- Verses are number patterns like "1-10", "2-5", or "10 ayat".
- Notes are EVERYTHING that remains after student + surah + verses.
- If no notes remain, use "".

For EDIT:
{{"action":"edit","student":"Name","surah":"Surah","verses":"Range","notes":"Notes"}}

For DELETE:
{{"action":"delete","target":"all OR last OR Name OR Name 2"}}

For VIEW:
{{"action":"view"}}

For STATS:
{{"action":"stats"}}

EXAMPLES:

User: Afdhal Al-Mulk 1-10 lancar
{{"action":"add","student":"Afdhal","surah":"Al-Mulk","verses":"1-10","notes":"lancar"}}

User: add Afdhal Al-Mulk 1-10 lancar
{{"action":"add","student":"Afdhal","surah":"Al-Mulk","verses":"1-10","notes":"lancar"}}

User: Ahmad Yasin 1-10 very smooth today
{{"action":"add","student":"Ahmad","surah":"Yasin","verses":"1-10","notes":"very smooth today"}}

User: Rizki An-Nur 1-10 tajwid kurang bagus
{{"action":"add","student":"Rizki","surah":"An-Nur","verses":"1-10","notes":"tajwid kurang bagus"}}

User: Budi Al-Kautsar 1-3
{{"action":"add","student":"Budi","surah":"Al-Kautsar","verses":"1-3","notes":""}}

User: Ahmad read Al-Mulk 1-10 lancar
{{"action":"add","student":"Ahmad","surah":"Al-Mulk","verses":"1-10","notes":"lancar"}}

User: edit Ahmad to Yasin 1-10 lancar
{{"action":"edit","student":"Ahmad","surah":"Yasin","verses":"1-10","notes":"lancar"}}

User: delete Ahmad 2
{{"action":"delete","target":"Ahmad 2"}}

User: show stats
{{"action":"stats"}}

User: view records
{{"action":"view"}}

---

Now process this:

User: "{user_text}"
"""

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=prompt
    )

    text = getattr(response, "text", None)
    if not text:
        text = response.candidates[0].content.parts[0].text

    logging.info(f"AI RAW: {text}")
    return extract_json(text)


def run_action(data):
    action = data.get("action")

    if action == "add":
        if not data.get("student") or not data.get("surah") or not data.get("verses"):
            return "❌ Try: Ahmad read Al-Mulk 1-10"
        return add_record(data)

    if action == "view":
        return view_records()

    if action == "delete":
        return delete_records(data.get("target") or data.get("student"))

    if action == "edit":
        return edit_last(
            data.get("student"),
            data.get("surah"),
            data.get("verses"),
            data.get("notes")
        )

    if action == "stats":
        return get_stats()

    return "Unknown command"


async def handle_ai_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return

    user_text = update.message.text
    lowered = normalize_spaces(user_text).lower()

    if context.user_data.get("step"):
        handled = await continue_flow(update, context)
        if handled:
            return

    if lowered == "add":
        await start_add_flow(update, context)
        return

    if lowered == "delete":
        await start_delete_flow(update, context)
        return

    if lowered == "edit":
        await start_edit_flow(update, context)
        return

    data = fallback_parse(user_text)

    if not data:
        try:
            data = parse_with_ai(user_text)
        except Exception as e:
            logging.error(f"AI parse failed: {e}")
            if not data:
                data = fallback_parse(user_text)

    logging.info(f"PARSED: {data}")

    if not data:
        await safe_reply_text(update, "❌ Could not understand. Try: Ahmad read Al-Mulk 1-10")
        return

    result = run_action(data)
    await safe_reply_text(update, result)


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    error = context.error

    if isinstance(error, (TimedOut, NetworkError)):
        logging.warning(f"Telegram network error: {error}")
        return

    logging.exception("Unhandled bot error", exc_info=error)

# ---------------- MAIN ---------------- #

if __name__ == "__main__":
    app = (
        ApplicationBuilder()
        .token(BOT_TOKEN)
        .connect_timeout(30.0)
        .read_timeout(30.0)
        .write_timeout(30.0)
        .pool_timeout(30.0)
        .build()
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("add", add_cmd))
    app.add_handler(CommandHandler("cancel", cancel_cmd))
    app.add_handler(CommandHandler("view", view_cmd))
    app.add_handler(CommandHandler("stats", stats_cmd))
    app.add_handler(CommandHandler("export", export_data))
    app.add_handler(CommandHandler("delete", delete_cmd))
    app.add_handler(CommandHandler("edit", edit_cmd))

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_ai_message))
    app.add_error_handler(error_handler)

    print("🚀 Bot is running...")
    app.run_polling()
