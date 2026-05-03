import { afterEach, describe, expect, it } from 'vitest';

import { resolveModelPricingUsd } from '@/lib/expertise/gemini/pricing';

describe('gemini pricing resolution', () => {
  const originalFlashLiteInput = process.env.CV_IMPORT_GEMINI_FLASH_LITE_INPUT_USD_PER_MILLION;
  const originalFlashLiteOutput = process.env.CV_IMPORT_GEMINI_FLASH_LITE_OUTPUT_USD_PER_MILLION;
  const originalFlashInput = process.env.CV_IMPORT_GEMINI_FLASH_INPUT_USD_PER_MILLION;
  const originalFlashOutput = process.env.CV_IMPORT_GEMINI_FLASH_OUTPUT_USD_PER_MILLION;

  afterEach(() => {
    if (originalFlashLiteInput === undefined) {
      delete process.env.CV_IMPORT_GEMINI_FLASH_LITE_INPUT_USD_PER_MILLION;
    } else {
      process.env.CV_IMPORT_GEMINI_FLASH_LITE_INPUT_USD_PER_MILLION = originalFlashLiteInput;
    }

    if (originalFlashLiteOutput === undefined) {
      delete process.env.CV_IMPORT_GEMINI_FLASH_LITE_OUTPUT_USD_PER_MILLION;
    } else {
      process.env.CV_IMPORT_GEMINI_FLASH_LITE_OUTPUT_USD_PER_MILLION = originalFlashLiteOutput;
    }

    if (originalFlashInput === undefined) {
      delete process.env.CV_IMPORT_GEMINI_FLASH_INPUT_USD_PER_MILLION;
    } else {
      process.env.CV_IMPORT_GEMINI_FLASH_INPUT_USD_PER_MILLION = originalFlashInput;
    }

    if (originalFlashOutput === undefined) {
      delete process.env.CV_IMPORT_GEMINI_FLASH_OUTPUT_USD_PER_MILLION;
    } else {
      process.env.CV_IMPORT_GEMINI_FLASH_OUTPUT_USD_PER_MILLION = originalFlashOutput;
    }
  });

  it('maps gemini-2.5-flash-lite to lite pricing family', () => {
    delete process.env.CV_IMPORT_GEMINI_FLASH_LITE_INPUT_USD_PER_MILLION;
    delete process.env.CV_IMPORT_GEMINI_FLASH_LITE_OUTPUT_USD_PER_MILLION;

    expect(resolveModelPricingUsd('gemini-2.5-flash-lite')).toEqual({
      inputPerMillion: 0.1,
      outputPerMillion: 0.4,
    });
  });

  it('applies lite pricing overrides for gemini-2.5-flash-lite', () => {
    process.env.CV_IMPORT_GEMINI_FLASH_LITE_INPUT_USD_PER_MILLION = '0.17';
    process.env.CV_IMPORT_GEMINI_FLASH_LITE_OUTPUT_USD_PER_MILLION = '0.47';

    expect(resolveModelPricingUsd('gemini-2.5-flash-lite')).toEqual({
      inputPerMillion: 0.17,
      outputPerMillion: 0.47,
    });
  });

  it('maps non-lite flash models to flash pricing family', () => {
    process.env.CV_IMPORT_GEMINI_FLASH_INPUT_USD_PER_MILLION = '0.35';
    process.env.CV_IMPORT_GEMINI_FLASH_OUTPUT_USD_PER_MILLION = '2.7';

    expect(resolveModelPricingUsd('gemini-3-flash-preview')).toEqual({
      inputPerMillion: 0.35,
      outputPerMillion: 2.7,
    });
  });
});
