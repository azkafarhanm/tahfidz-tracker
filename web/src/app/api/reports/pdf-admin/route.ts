import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminReportData } from "@/lib/reports";
import { generatePdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAdminReportData();

  const html = `
    <h1>Laporan Admin</h1>
    <p class="subtitle">Ringkasan keseluruhan sistem TahfidzFlow</p>

    <div class="cards">
      <div class="card"><div class="card-label">Guru</div><div class="card-value">${data.totalTeachers}</div></div>
      <div class="card"><div class="card-label">Santri</div><div class="card-value">${data.totalStudents}</div></div>
      <div class="card"><div class="card-label">Hafalan</div><div class="card-value">${data.totalHafalan}</div></div>
      <div class="card"><div class="card-label">Murojaah</div><div class="card-value">${data.totalMurojaah}</div></div>
      <div class="card"><div class="card-label">Target Aktif</div><div class="card-value">${data.totalActiveTargets}</div></div>
    </div>

    <h2>Data Guru</h2>
    <table>
      <thead><tr><th>Nama</th><th>Email</th><th>Santri</th><th>Halaqah</th></tr></thead>
      <tbody>${data.teachers.map((t) => `<tr>
        <td><strong>${t.fullName}</strong></td>
        <td>${t.email}</td>
        <td>${t.studentCount}</td>
        <td>${t.classGroupCount}</td>
      </tr>`).join("")}</tbody>
    </table>
  `;

  const pdfBuffer = await generatePdf(html, "Laporan Admin - TahfidzFlow");
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(Buffer.from(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="laporan-admin-${date}.pdf"`,
    },
  });
}
