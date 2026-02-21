import { describe, expect, it } from 'vitest';
import { WEATHER_FRESHNESS_COPY, WEATHER_SOURCE_COPY } from './weatherEdgeCopy';

describe('weather edge-state copy', () => {
  it('keeps freshness labels stable', () => {
    expect(WEATHER_FRESHNESS_COPY).toMatchInlineSnapshot(`
      {
        "degraded": "Showing last known weather due to refresh issues",
        "fresh": "Live weather data",
        "offline": "You are offline. Showing last known weather",
        "stale": "Data is stale",
        "unavailable": "Weather is unavailable",
      }
    `);
  });

  it('keeps location source labels stable', () => {
    expect(WEATHER_SOURCE_COPY).toMatchInlineSnapshot(`
      {
        "gps": "GPS",
        "manual": "Manual location",
        "saved_profile": "Saved profile location",
        "unknown": "Unknown source",
      }
    `);
  });
});

