import { registerPlugin } from '@capacitor/core';

import type { CapgoAppIntentsPlugin } from './definitions';

export const CapgoAppIntents = registerPlugin<CapgoAppIntentsPlugin>('CapgoAppIntents', {
  web: () => import('./web').then((m) => new m.CapgoAppIntentsWeb()),
});
