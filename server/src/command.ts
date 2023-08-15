import { CommandFactory } from 'nest-commander';
import { CommandModule } from './command.module';

const bootstrap = async () => {
  try {
    console.log('fucking reached here');
    await CommandFactory.run(CommandModule, ['warn', 'error', 'debug', 'log']);
    console.log('success');
  } catch (err) {
    console.log(err);
  }
};

bootstrap();
