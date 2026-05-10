import { authedMultipartJson } from "./authed-client";

export type NurseCsvImportItemResult = {
  email: string;
  status: "created" | "skipped" | "failed";
  message?: string;
};

export type NurseCsvImportResult = {
  defaultPassword: string;
  totalEmailsFound: number;
  created: number;
  skipped: number;
  failed: number;
  results: NurseCsvImportItemResult[];
};

export async function importNursesFromCsv(
  accessToken: string,
  file: File,
): Promise<NurseCsvImportResult> {
  const form = new FormData();
  form.append("file", file);
  return authedMultipartJson<NurseCsvImportResult>(
    "/admin/nurse-import/csv",
    accessToken,
    form,
  );
}
