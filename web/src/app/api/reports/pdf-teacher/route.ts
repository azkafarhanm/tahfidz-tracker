import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTeacherReportData } from "@/lib/reports";
import { generatePdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "ADMIN" || !session.user.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getTeacherReportData(session.user.teacherId);

  const html = `
    <h1>Laporan Guru</h1>
    <p class="subtitle">Ringkasan progres halaqah dan santri</p>

    <div class="cards">
      <div class="card"><div class="card-label">Santri</div><div class="card-value">${data.studentCount}</div></div>
      <div class="card"><div class="card-label">Hafalan</div><div class="card-value">${data.totalHafalan}</div></div>
      <div class="card"><div class="card-label">Murojaah</div><div class="card-value">${data.totalMurojaah}</div></div>
      <div class="card"><div class="card-label">Skor Rata-rata</div><div class="card-value green">${data.avgScore || "-"}</div></div>
      <div class="card"><div class="card-label">Perlu Cek</div><div class="card-value amber">${data.needsReviewCount}</div></div>
      <div class="card"><div class="card-label">Target Aktif</div><div class="card-value">${data.activeTargetCount}</div></div>
    </div>

    ${data.classGroups.length > 0 ? `
      <h2>Halaqah</h2>
      <table>
        <thead><tr><th>Nama</th><th>Level</th><th>Jumlah Santri</th></tr></thead>
        <tbody>${data.classGroups.map((cg) => `<tr><td>${cg.name}</td><td>${cg.level}</td><td>${cg.studentCount}</td></tr>`).join("")}</tbody>
      </table>
    ` : ""}

    <h2>Progres Santri</h2>
    <table>
      <thead><tr><th>Nama</th><th>Halaqah</th><th>Hafalan</th><th>Murojaah</th><th>Skor</th><th>Ayat Terakhir</th><th>Status</th></tr></thead>
      <tbody>${data.students.map((s) => `<tr>
        <td><strong>${s.fullName}</strong></td>
        <td>${s.halaqahName}</td>
        <td>${s.hafalanCount}</td>
        <td>${s.murojaahCount}</td>
        <td><strong>${s.avgScore || "-"}</strong></td>
        <td>${s.lastRange}</td>
        <td>${s.needsReview ? `<span class="badge badge-amber">Perlu Cek</span>` : `<span class="badge badge-green">${s.lastStatus}</span>`}</td>
      </tr>`).join("")}</tbody>
    </table>
  `;

  const pdfBuffer = await generatePdf(html, "Laporan Guru - TahfidzFlow");
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(Buffer.from(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="laporan-guru-${date}.pdf"`,
    },
  });
}
