import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoredBooking } from "./schemas";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");

async function ensureDataFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(BOOKINGS_FILE, "utf-8");
  } catch {
    await writeFile(BOOKINGS_FILE, "[]\n", "utf-8");
  }
}

export async function readBookings(): Promise<StoredBooking[]> {
  await ensureDataFile();
  const raw = await readFile(BOOKINGS_FILE, "utf-8");
  return JSON.parse(raw) as StoredBooking[];
}

export async function saveBooking(booking: StoredBooking): Promise<void> {
  const bookings = await readBookings();
  bookings.push(booking);
  await writeFile(BOOKINGS_FILE, `${JSON.stringify(bookings, null, 2)}\n`, "utf-8");
}

export function generateBookingId(): string {
  const date = new Date();
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CW-${ymd}-${suffix}`;
}
