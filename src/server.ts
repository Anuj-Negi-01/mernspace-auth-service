import { Config } from './config';
import app from './app';
import logger from './config/logger';

const startServer = () => {
  const PORT = Config.PORT;
  try {
    app.listen(PORT, () => {
      logger.error('Testing error..');
      logger.info('Server listening on Port', { port: PORT });
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

startServer();
