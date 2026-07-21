import { TranslateService } from '../src/modules/translate/translate.service';
import { ConfigService } from '@nestjs/config';

async function test() {
  const config = new ConfigService({
    GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY || ''
  });
  const service = new TranslateService(config);

  console.log('Testing TranslateService cache & API/fallback...');

  // Call 1: Miss (Google API or MyMemory)
  console.time('Call 1 (Miss)');
  const res1 = await service.translate({ text: 'Hello, how are you?', target: 'vi', source: 'en' });
  console.timeEnd('Call 1 (Miss)');
  console.log('Result 1:', res1);

  // Call 2: Hit (Cache)
  console.time('Call 2 (Hit)');
  const res2 = await service.translate({ text: 'Hello, how are you?', target: 'vi', source: 'en' });
  console.timeEnd('Call 2 (Hit)');
  console.log('Result 2:', res2);

  // Call 3: Same text, different target (should be Miss)
  console.time('Call 3 (Miss - different target)');
  const res3 = await service.translate({ text: 'Hello, how are you?', target: 'fr', source: 'en' });
  console.timeEnd('Call 3 (Miss - different target)');
  console.log('Result 3:', res3);
}

test().catch(console.error);
