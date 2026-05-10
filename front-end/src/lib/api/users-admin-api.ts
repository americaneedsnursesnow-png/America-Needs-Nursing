import { getAuthClientName } from "./env";
import { authedJson } from "./authed-client";

export type ProvisionAdminUserBody = {
  email: string;
  password: string;
  /** Nest `UserRole` string */
  role: string;
  clientName?: string;
};

/**
 * `POST /users` (JWT `super_admin` only). May assign `content_admin` or `super_admin`
 * (enforced on the server).
 */
export async function provisionAdminUser(
  accessToken: string,
  body: ProvisionAdminUserBody,
): Promise<void> {
  await authedJson<unknown>("/users", accessToken, {
    method: "POST",
    body: JSON.stringify({
      clientName: (body.clientName ?? getAuthClientName()).trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      role: body.role,
    }),
  });
}
