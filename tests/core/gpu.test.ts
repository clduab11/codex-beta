import { afterEach, describe, expect, it, vi } from 'vitest';
import { GPUManager } from '../../src/core/gpu';

describe('GPUManager probe caching', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reuses cached probe results within the configured TTL', () => {
    const manager = new GPUManager();
    const detectCudaSpy = vi.spyOn(manager as any, 'detectCuda').mockReturnValue({
      available: false,
      devices: [],
      diagnostics: ['mocked cuda']
    });
    const detectMpsSpy = vi.spyOn(manager as any, 'detectMps').mockReturnValue({
      available: false,
      devices: [],
      diagnostics: ['mocked mps']
    });

    manager.setProbeCacheOptions({ disableCache: false, probeCacheTtlMs: 300_000 });
    vi.useFakeTimers();

    manager.refreshStatus(true);
    expect(detectCudaSpy).toHaveBeenCalledTimes(1);
    expect(detectMpsSpy).toHaveBeenCalledTimes(1);

    detectCudaSpy.mockClear();
    detectMpsSpy.mockClear();

    manager.refreshStatus();
    expect(detectCudaSpy).not.toHaveBeenCalled();
    expect(detectMpsSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300_000);
    manager.refreshStatus();
    expect(detectCudaSpy).toHaveBeenCalledTimes(1);
    expect(detectMpsSpy).toHaveBeenCalledTimes(1);
  });
});
