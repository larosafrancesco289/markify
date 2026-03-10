import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

type UrlValidationCode = "INVALID_URL" | "URL_NOT_ALLOWED";

export class UrlValidationError extends Error {
  readonly code: UrlValidationCode;

  constructor(code: UrlValidationCode, message: string) {
    super(message);
    this.name = "UrlValidationError";
    this.code = code;
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [".localhost", ".local", ".internal"];

function normalizeIpHostname(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

function ipv4ToNumber(address: string): number {
  return address
    .split(".")
    .map((segment) => Number(segment))
    .reduce((accumulator, segment) => (accumulator << 8) + segment, 0);
}

function isPrivateIpv4(address: string): boolean {
  const value = ipv4ToNumber(address);

  const blockedRanges: Array<[number, number]> = [
    [ipv4ToNumber("0.0.0.0"), ipv4ToNumber("0.255.255.255")],
    [ipv4ToNumber("10.0.0.0"), ipv4ToNumber("10.255.255.255")],
    [ipv4ToNumber("100.64.0.0"), ipv4ToNumber("100.127.255.255")],
    [ipv4ToNumber("127.0.0.0"), ipv4ToNumber("127.255.255.255")],
    [ipv4ToNumber("169.254.0.0"), ipv4ToNumber("169.254.255.255")],
    [ipv4ToNumber("172.16.0.0"), ipv4ToNumber("172.31.255.255")],
    [ipv4ToNumber("192.0.0.0"), ipv4ToNumber("192.0.0.255")],
    [ipv4ToNumber("192.168.0.0"), ipv4ToNumber("192.168.255.255")],
    [ipv4ToNumber("198.18.0.0"), ipv4ToNumber("198.19.255.255")],
    [ipv4ToNumber("224.0.0.0"), ipv4ToNumber("255.255.255.255")],
  ];

  return blockedRanges.some(
    ([start, end]) => value >= start && value <= end
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalizedAddress = address.toLowerCase();

  if (
    normalizedAddress === "::" ||
    normalizedAddress === "::1" ||
    normalizedAddress.startsWith("fc") ||
    normalizedAddress.startsWith("fd") ||
    normalizedAddress.startsWith("fe8") ||
    normalizedAddress.startsWith("fe9") ||
    normalizedAddress.startsWith("fea") ||
    normalizedAddress.startsWith("feb")
  ) {
    return true;
  }

  if (normalizedAddress.startsWith("::ffff:")) {
    return isPrivateIpv4(normalizedAddress.slice("::ffff:".length));
  }

  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();

  return (
    BLOCKED_HOSTNAMES.has(normalizedHostname) ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) =>
      normalizedHostname.endsWith(suffix)
    )
  );
}

function assertPublicAddress(address: string): void {
  const family = isIP(address);

  if (family === 4 && isPrivateIpv4(address)) {
    throw new UrlValidationError(
      "URL_NOT_ALLOWED",
      "Private network addresses are not allowed"
    );
  }

  if (family === 6 && isPrivateIpv6(address)) {
    throw new UrlValidationError(
      "URL_NOT_ALLOWED",
      "Private network addresses are not allowed"
    );
  }
}

async function assertPublicHostname(hostname: string): Promise<void> {
  const normalizedHostname = normalizeIpHostname(hostname);

  if (isBlockedHostname(normalizedHostname)) {
    throw new UrlValidationError(
      "URL_NOT_ALLOWED",
      "Local and internal URLs are not allowed"
    );
  }

  if (isIP(normalizedHostname)) {
    assertPublicAddress(normalizedHostname);
    return;
  }

  try {
    const resolvedAddresses = await lookup(normalizedHostname, {
      all: true,
      verbatim: true,
    });

    for (const resolvedAddress of resolvedAddresses) {
      assertPublicAddress(resolvedAddress.address);
    }
  } catch {
    // Let the downstream fetch return a network error if DNS cannot resolve.
  }
}

export async function validatePublicHttpUrl(rawUrl: string): Promise<URL> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl.trim());
  } catch {
    throw new UrlValidationError("INVALID_URL", "Invalid URL provided");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new UrlValidationError(
      "INVALID_URL",
      "Only http and https URLs are supported"
    );
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new UrlValidationError(
      "URL_NOT_ALLOWED",
      "Credentialed URLs are not allowed"
    );
  }

  await assertPublicHostname(parsedUrl.hostname);

  return parsedUrl;
}
