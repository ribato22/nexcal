import { lookup } from "node:dns";
import { get } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import ipaddr from "ipaddr.js";

const MAX_BYTES = 1024 * 1024;

export function calendarFeedUrl(value: string): URL {
  const url = new URL(value.trim().replace(/^webcal:\/\//i, "https://"));
  if (
    url.protocol !== "https:" || url.username || url.password || url.port || url.hash ||
    !url.hostname.includes(".") || isIP(url.hostname) ||
    url.hostname.startsWith("[") || url.href.length > 2048
  ) {
    throw new Error("Invalid calendar feed URL");
  }
  return url;
}

export function isPublicCalendarAddress(address: string): boolean {
  if (!isIP(address)) return false;
  const ip = ipaddr.parse(address);
  return ip.range() === "unicast" && (
    ip.kind() === "ipv4" || ip.match(ipaddr.IPv6.parse("2000::"), 3)
  );
}

const publicLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { all: true, family: options.family }, (error, addresses) => {
    if (error || !addresses.length || addresses.some(({ address }) => !isPublicCalendarAddress(address))) {
      callback(new Error("Calendar feed requires a public address"), "");
      return;
    }
    // Give the socket only the validated results, so it cannot resolve the host again.
    const [first] = addresses;
    if (options.all) callback(null, addresses);
    else callback(null, first.address, first.family);
  });
};

export async function downloadCalendarFeed(value: string): Promise<string> {
  const signal = AbortSignal.timeout(5000);
  let url = calendarFeedUrl(value);

  for (let redirects = 0; redirects <= 2; redirects++) {
    const result = await new Promise<{ body: string } | { redirect: string }>((resolve, reject) => {
      get(url, { lookup: publicLookup, signal, agent: false }, async (response) => {
        try {
          if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0) && response.headers.location) {
            response.destroy();
            resolve({ redirect: response.headers.location });
            return;
          }
          if (response.statusCode !== 200 || Number(response.headers["content-length"]) > MAX_BYTES) {
            throw new Error("Calendar feed unavailable");
          }
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of response) {
            size += chunk.length;
            if (size > MAX_BYTES) throw new Error("Calendar feed too large");
            chunks.push(chunk);
          }
          resolve({ body: Buffer.concat(chunks).toString("utf8") });
        } catch (error) {
          response.destroy();
          reject(error);
        }
      }).on("error", reject);
    });

    if ("body" in result) return result.body;
    url = calendarFeedUrl(new URL(result.redirect, url).href);
  }
  throw new Error("Too many calendar feed redirects");
}
