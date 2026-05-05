import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStudentProgressData } from "@/lib/reports";
import { generatePdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherId = session.user.role === "ADMIN" ? null : session.user.teacherId;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  const data = await getStudentProgressData(studentId, teacherId);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const html = `
    <h1>${data.fullName}</h1>
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Halaqah</div><div class="meta-value">${data.halaqahName} (${data.halaqahLevel})</div></div>
      <div class="meta-item"><div class="meta-label">Kelas</div><div class="meta-value">${data.academicClassName}</div></div>
    </div>

    <div class="cards">
      <div class="card"><div class="card-label">Hafalan</div><div class="card-value">${data.hafalanCount}</div></div>
      <div class="card"><div class="card-label">Murojaah</div><div class="card-value">${data.murojaahCount}</div></div>
      <div class="card"><div class="card-label">Skor Rata-rata</div><div class="card-value green">${data.avgScore || "-"}</div></div>
      <div class="card"><div class="card-label">Total Catatan</div><div class="card-value">${data.records.length}</div></div>
    </div>

    ${data.activeTargets.length > 0 ? `
      <h2>Target Aktif</h2>
      <table>
        <thead><tr><th>Tipe</th><th>Ayat</th><th>Mulai</th><th>Target Selesai</th><th>Catatan</th></tr></thead>
        <tbody>${data.activeTargets.map((t) => `<tr>
          <td><span class="badge ${t.type === "Hafalan" ? "badge-green" : "badge-blue"}">${t.type}</span></td>
          <td>${t.range}</td>
          <td>${t.startDate}</td>
          <td>${t.endDate}</td>
          <td>${t.notes ?? "-"}</td>
        </tr>`).join("")}</tbody>
      </table>
    ` : ""}

    <h2>Riwayat Hafalan &amp; Murojaah</h2>
    ${data.records.length > 0 ? `
      <table>
        <thead><tr><th>Tanggal</th><th>Tipe</th><th>Ayat</th><th>Skor</th><th>Status</th></tr></thead>
        <tbody>${data.records.map((r) => `<tr>
          <td>${r.date}</td>
          <td><span class="badge ${r.type === "Hafalan" ? "badge-green" : "badge-blue"}">${r.type}</span></td>
          <td>${r.range}</td>
          <td><strong>${r.score ?? "-"}</strong></td>
          <td>${r.needsReview ? `<span class="badge badge-amber">${r.status}</span>` : r.status}</td>
        </tr>`).join("")}</tbody>
      </table>
    ` : '<p style="color:#94a3b8;">Belum ada catatan.</p>'}
  `;

  const pdfBuffer = await generatePdf(html, `${data.fullName} - TahfidzFlow`);
  const safeName = data.fullName.replace(/\s+/g, "-").toLowerCase();
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(Buffer.from(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="progres-${safeName}-${date}.pdf"`,
    },
  });
}
