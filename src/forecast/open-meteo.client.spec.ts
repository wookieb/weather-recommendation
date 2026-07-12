import { Client, type Dispatcher } from 'undici';
import sinon from 'sinon';
import { describe, expect, it } from 'vitest';
import { type Location } from '../location/location.types';
import { OpenMeteoClient } from './open-meteo.client';

const london: Location = {
  slug: 'london-gb',
  name: 'London',
  country: { code: 'GB', name: 'United Kingdom' },
  geocoordinate: { latitude: 51.50853, longitude: -0.12574 },
};

describe('OpenMeteoClient.getForecast', () => {
  it('requests local 7-day Open-Meteo daily data', async () => {
    const requestOptions: Array<{ path?: string; method?: string }> = [];
    const httpClient = fakeClient({
      request(options: Dispatcher.RequestOptions) {
        requestOptions.push({ path: options.path, method: options.method });
        return responseWithStatus(200, { daily: { time: [] } });
      },
    });
    const openMeteoClient = new OpenMeteoClient(httpClient);

    await openMeteoClient.getForecast(london);

    expect(requestOptions).toHaveLength(1);
    expect(requestOptions[0]?.method).toBe('GET');
    const path = new URL(
      `https://api.open-meteo.com${requestOptions[0]?.path}`,
    );
    expect(path.pathname).toBe('/v1/forecast');
    expect(path.searchParams.get('latitude')).toBe('51.50853');
    expect(path.searchParams.get('longitude')).toBe('-0.12574');
    expect(path.searchParams.get('forecast_days')).toBe('7');
    expect(path.searchParams.get('timezone')).toBe('auto');
    expect(path.searchParams.get('temperature_unit')).toBe('celsius');
    expect(path.searchParams.get('windspeed_unit')).toBe('kmh');
    expect(path.searchParams.get('precipitation_unit')).toBe('mm');
    expect(path.searchParams.get('daily')).toBe(
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,snowfall_sum,sunshine_duration',
    );
  });

  it('throws for HTTP errors', async () => {
    const openMeteoClient = new OpenMeteoClient(
      fakeClient({
        request: () => responseWithStatus(500, { daily: { time: [] } }),
      }),
    );

    await expect(openMeteoClient.getForecast(london)).rejects.toThrow(
      'Open-Meteo request failed with 500',
    );
  });

  it('throws for invalid provider JSON', async () => {
    const openMeteoClient = new OpenMeteoClient(
      fakeClient({
        request: () => responseWithStatus(200, {}),
      }),
    );

    await expect(openMeteoClient.getForecast(london)).rejects.toThrow(
      'Open-Meteo request failed',
    );
  });
});

describe('OpenMeteoClient.getSurfConditions', () => {
  it('requests local 7-day Open-Meteo daily marine data from sea grid cells', async () => {
    const requestOptions: Array<{ path?: string; method?: string }> = [];
    const forecastClient = fakeClient({
      request() {
        throw new Error('Forecast client should not receive marine requests');
      },
    });
    const marineClient = fakeClient({
      request(options: Dispatcher.RequestOptions) {
        requestOptions.push({ path: options.path, method: options.method });
        return responseWithStatus(200, { daily: { time: [] } });
      },
    });
    const openMeteoClient = new OpenMeteoClient(forecastClient, marineClient);

    await openMeteoClient.getSurfConditions(london);

    expect(requestOptions).toHaveLength(1);
    expect(requestOptions[0]?.method).toBe('GET');
    const path = new URL(
      `https://api.open-meteo.com${requestOptions[0]?.path}`,
    );
    expect(path.pathname).toBe('/v1/marine');
    expect(path.searchParams.get('latitude')).toBe('51.50853');
    expect(path.searchParams.get('longitude')).toBe('-0.12574');
    expect(path.searchParams.get('forecast_days')).toBe('7');
    expect(path.searchParams.get('timezone')).toBe('auto');
    expect(path.searchParams.get('cell_selection')).toBe('sea');
    expect(path.searchParams.get('length_unit')).toBe('metric');
    expect(path.searchParams.get('daily')).toBe(
      'wave_height_max,wave_period_max,wave_direction_dominant,swell_wave_height_max,swell_wave_period_max,swell_wave_direction_dominant,wind_wave_height_max',
    );
  });

  it('throws for marine HTTP errors', async () => {
    const openMeteoClient = new OpenMeteoClient(
      fakeClient({
        request: () => responseWithStatus(500, { daily: { time: [] } }),
      }),
    );

    await expect(openMeteoClient.getSurfConditions(london)).rejects.toThrow(
      'Open-Meteo request failed with 500',
    );
  });
});

function responseWithStatus(statusCode: number, body: unknown) {
  return Promise.resolve({
    statusCode,
    body: { json: () => Promise.resolve(body) },
  } as Dispatcher.ResponseData);
}

function fakeClient(partial: Pick<Client, 'request'>): Client {
  const client = sinon.createStubInstance(Client);
  client.request.callsFake(partial.request);
  return client;
}
