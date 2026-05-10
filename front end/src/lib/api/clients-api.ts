import { authedJson } from "./authed-client";

export type ClientPlatformSettings = {
  freeTierJobPostsPerMonth: number;
};

export type UpdateClientPlatformSettingsBody = {
  freeTierJobPostsPerMonth: number;
};

export async function getClientPlatformSettings(
  accessToken: string,
): Promise<ClientPlatformSettings> {
  return authedJson<ClientPlatformSettings>(
    "/clients/platform-settings",
    accessToken,
    { method: "GET" },
  );
}

export async function updateClientPlatformSettings(
  accessToken: string,
  body: UpdateClientPlatformSettingsBody,
): Promise<ClientPlatformSettings> {
  return authedJson<ClientPlatformSettings>(
    "/clients/platform-settings",
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}
