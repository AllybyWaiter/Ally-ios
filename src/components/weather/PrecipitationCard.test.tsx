import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrecipitationCard } from './PrecipitationCard';
import type { HourlyForecast } from '@/hooks/useWeather';

const makeHour = (overrides: Partial<HourlyForecast> = {}): HourlyForecast => ({
  time: '2026-02-06T00:00:00Z',
  temperature: 72,
  condition: 'clear',
  isDay: true,
  precipitationProbability: 0,
  precipitation: 0,
  ...overrides,
});

describe('PrecipitationCard', () => {
  it('shows 0% placeholder continuity when hourly precipitation data is missing', () => {
    render(
      <PrecipitationCard
        precipitationProbability={0}
        precipitationAmount={0}
        hourlyForecast={[]}
        units="imperial"
      />
    );

    expect(screen.getByText('No hourly precipitation values available, showing 0% placeholders.')).toBeInTheDocument();
    expect(screen.getByText('0% / no data')).toBeInTheDocument();
    expect(screen.getByText('Peak chance')).toBeInTheDocument();
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    expect(screen.getByText('0.00 in')).toBeInTheDocument();
    expect(screen.getAllByTestId('precip-hour-bar')).toHaveLength(12);
  });

  it('shows 0% placeholder continuity when hourly precipitation is all zeros', () => {
    render(
      <PrecipitationCard
        precipitationProbability={0}
        precipitationAmount={0}
        hourlyForecast={Array.from({ length: 12 }, () => makeHour({ precipitationProbability: 0, precipitation: 0 }))}
        units="imperial"
      />
    );

    expect(screen.getByText('0% / no precipitation expected')).toBeInTheDocument();
    expect(
      screen.getByText('No precipitation expected in the next 12 hours, showing 0% placeholders.')
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('precip-hour-bar')).toHaveLength(12);
  });

  it('keeps the placeholder visible when chances are 0% even with trace precipitation amounts', () => {
    render(
      <PrecipitationCard
        precipitationProbability={0}
        precipitationAmount={0}
        hourlyForecast={Array.from({ length: 12 }, () => makeHour({ precipitationProbability: 0, precipitation: 0.001 }))}
        units="imperial"
      />
    );

    expect(screen.getByText('0% / no precipitation expected')).toBeInTheDocument();
    expect(
      screen.getByText('No precipitation expected in the next 12 hours, showing 0% placeholders.')
    ).toBeInTheDocument();
  });

  it('renders hourly precipitation values when available', () => {
    render(
      <PrecipitationCard
        precipitationProbability={10}
        precipitationAmount={0}
        hourlyForecast={[
          makeHour({ precipitationProbability: 35, precipitation: 0.5 }),
          makeHour({ precipitationProbability: 20, precipitation: 0.2 }),
        ]}
        units="imperial"
      />
    );

    expect(screen.queryByText('No hourly precipitation values available, showing 0% placeholders.')).not.toBeInTheDocument();
    expect(screen.queryByText('No precipitation expected in the next 12 hours, showing 0% placeholders.')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('precip-hour-bar')).toHaveLength(12);
    expect(screen.getByText('35%')).toBeInTheDocument();
  });
});
