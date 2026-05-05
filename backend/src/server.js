import userService from './services/userService.js';
import { registerResultController } from './controllers/resultsController.js';

export function registerResultRoutes({ app, getSession }) {
  registerResultController({ app, getSession });
}
