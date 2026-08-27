type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
};

/**
 * Turns device coordinates into a human-readable "City, Region" string using
 * OpenStreetMap's free Nominatim reverse-geocoding API. No API key required.
 * Returns null (never throws) if the lookup fails or nothing address-like
 * comes back, so a failed lookup never blocks saving a capture.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "OrbitRelationshipApp/1.0 (personal relationship memory app)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { address?: NominatimAddress };
    const address = data.address ?? {};
    const place =
      address.city || address.town || address.village || address.suburb || address.county;
    const region = address.state || address.region || address.country;

    const parts = [place, region].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );

    return parts.length ? parts.join(", ") : null;
  } catch {
    return null;
  }
}
