export type CsvColumn<T> = { header: string; value: (row: T) => string | number | undefined }

// Excel in Spain and Latin America splits columns on «;», and the BOM makes it read «Lucía» as UTF-8.
const SEPARATOR = ';'
const BOM = '﻿'

// csvField('Dice "urgente"') is '"Dice ""urgente"""'. Every field is quoted, so line breaks inside a message are safe.
const csvField = (value: string | number | undefined) => `"${String(value ?? '').replaceAll('"', '""')}"`

export function toCsv<T>({ columns, rows }: { columns: CsvColumn<T>[]; rows: T[] }) {
  const header = columns.map((column) => csvField(column.header)).join(SEPARATOR)
  const lines = rows.map((row) => columns.map((column) => csvField(column.value(row))).join(SEPARATOR))
  return BOM + [header, ...lines].join('\r\n')
}

// Saves `content` as a file through a temporary link, as a «Descargar» button does in any web app.
export function downloadFile({ fileName, content, type }: { fileName: string; content: string; type: string }) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// exportFileName({ what: 'tickets', parts: ['2026-11-14', 'ES'] }) is 'peluda-tickets-2026-11-14-ES.csv'; filters left empty drop out.
export function exportFileName({ what, parts }: { what: string; parts: (string | undefined)[] }) {
  return ['peluda', what, ...parts.filter(Boolean)].join('-') + '.csv'
}
