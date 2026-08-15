import { createKeycloakClient, type KeycloakClient } from "@codementor/auth";

let client: KeycloakClient | null = null;
let initialization: Promise<boolean> | null = null;

export function getKeycloakClient(): KeycloakClient {
  client ??= createKeycloakClient({
    url: required("NEXT_PUBLIC_KEYCLOAK_URL", process.env.NEXT_PUBLIC_KEYCLOAK_URL),
    realm: required("NEXT_PUBLIC_KEYCLOAK_REALM", process.env.NEXT_PUBLIC_KEYCLOAK_REALM),
    clientId: required(
      "NEXT_PUBLIC_KEYCLOAK_CLIENT_ID",
      process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
    ),
  });
  return client;
}

export function initializeKeycloak(): Promise<boolean> {
  const keycloak = getKeycloakClient();
  initialization ??= keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
  return initialization;
}

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing browser-safe environment variable: ${name}`);
  return value;
}
