import { hostname } from "os";

export const environment = {
  production: false,
  //apiUrl: 'http://localhost:3000/api',
  apiUrl: 'http://' + hostname() + ':4200' + '/api',
  appName: 'plazaclic',
  enableDebug: true,
  host: 'http://' + hostname() + ':4200'
};
