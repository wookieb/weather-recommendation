export type Country = {
  code: string;
  name: string;
};

export type Geocoordinate = {
  latitude: number;
  longitude: number;
};

export type Location = {
  slug: string;
  name: string;
  country: Country;
  geocoordinate: Geocoordinate;
};

export type LocationQuery = {
  name: string;
  country: string;
};
