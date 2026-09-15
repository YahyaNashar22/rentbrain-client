export type ExcelValue = string | number | boolean | Date | null | undefined
export type ExcelRow = Record<string, ExcelValue>

const safeSheetName = (value: string) =>
  value.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || "Export"

export async function exportExcel(
  fileName: string,
  sheetName: string,
  rows: ExcelRow[],
) {
  if (!rows.length) throw new Error("There is no data to export.")

  const headers = Object.keys(rows[0])
  const headerRow = headers.map((header) => ({
    value: header,
    fontWeight: "bold" as const,
    backgroundColor: "D9E8FF",
  }))
  const dataRows = rows.map((row) => headers.map((header) => row[header] ?? null))
  const { default: writeExcelFile } = await import("write-excel-file/browser")

  await writeExcelFile([headerRow, ...dataRows], {
    sheet: safeSheetName(sheetName),
    stickyRowsCount: 1,
  }).toFile(fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`)
}

export const exportDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : ""

