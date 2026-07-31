type ReportWithName = {
  reporterName?: string | null;
  createdBy: { name: string };
};

export function getReporterDisplayName(report: ReportWithName): string {
  const name = report.reporterName?.trim();
  if (name) return name;
  return report.createdBy.name;
}
