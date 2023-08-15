import * as NodeGeocoder from 'node-geocoder';
import { Injectable } from '@nestjs/common';
const options = {
  provider: 'google',

  // Optional depending on the providers
  // fetch: customFetchImplementation,
  // todo: move this to environment variable
  apiKey: 'AIzaSyBz-Y0ERlkgBcq8YFUimZA3O9CW90YsRGU', // for Mapquest, OpenCage, Google Premier
  formatter: null, // 'gpx', 'string', ...
};
@Injectable()
export class GeoService {
  async getPlaceNameFromLatLong(lat, lon) {
    const geocoder = NodeGeocoder(options);
    const res = await geocoder.reverse({ lat, lon });
    if (Array.isArray(res) && res.length) {
      const firstPlace = res[0];
      return firstPlace.formattedAddress;
    }
    return '';
  }
}
