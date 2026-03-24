export type HomeListing = {
  id: string;
  title: string;
  price: string;
  beds: number;
  baths: number;
  size: number;
  rentalType: string;
  area: string;
  distance: string;
  availability: string;
  isAvailable: boolean;
  hasSolar: boolean;
  growthPrediction: string;
  landlord: {
    name: string;
    phone: string;
    avatarLabel: string;
  };
  gallery: string[];
  coordinate: {
    latitude: number;
    longitude: number;
  };
};
