import { handleApiHttpRequest } from '../server/authAndDataServer.mjs';

export default async function handler(req, res) {
  return handleApiHttpRequest(req, res);
}
