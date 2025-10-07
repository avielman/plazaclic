import { hostname } from "os";

export const environment = {
  production: true,
  //apiUrl: 'https://api.plazaclic.com/api',
  apiUrl: 'http://' + hostname() + ':4200' + '/api',
  appName: 'plazaclic',
  enableDebug: false,
  host: 'http://' + hostname() + ':4200'
};
