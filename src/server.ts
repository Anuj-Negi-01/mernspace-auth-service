import { Config } from './config';
import app from './app';
import logger from './config/logger';
import { AppDataSource } from './config/data-source';

const startServer = async () => {
  const PORT = Config.PORT;
  try {
    await AppDataSource.initialize();
    logger.info('Database connected successfully.');
    app.listen(PORT, () => {
      logger.info('Server listening on Port', { port: PORT });
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

startServer();
