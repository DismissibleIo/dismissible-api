import { substituteVariables } from './variable-substitution';

describe('substituteVariables', () => {
  it('should replace a placeholder with the environment variable', () => {
    const result = substituteVariables({ server: { port: '${PORT}' } }, { PORT: '8080' });

    expect(result).toEqual({ server: { port: '8080' } });
  });

  it('should use the default value when the environment variable is not set', () => {
    const result = substituteVariables({ port: '${PORT:-3001}' }, {});

    expect(result).toEqual({ port: '3001' });
  });

  it('should prefer the environment variable over the default value', () => {
    const result = substituteVariables({ port: '${PORT:-3001}' }, { PORT: '8080' });

    expect(result).toEqual({ port: '8080' });
  });

  it('should use an empty environment variable rather than the default value', () => {
    const result = substituteVariables({ origins: '${ORIGINS:-*}' }, { ORIGINS: '' });

    expect(result).toEqual({ origins: '' });
  });

  it('should support an empty default value', () => {
    const result = substituteVariables({ url: '${URL:-}' }, {});

    expect(result).toEqual({ url: '' });
  });

  it('should keep everything after the first separator as the default value', () => {
    const result = substituteVariables({ priority: '${PRIORITY:--100}', a: '${A:-x:-y}' }, {});

    expect(result).toEqual({ priority: '-100', a: 'x:-y' });
  });

  it('should keep quotes in the default value', () => {
    const result = substituteVariables({ keyPrefix: '${PREFIX:-"dismissible:cache:"}' }, {});

    expect(result).toEqual({ keyPrefix: '"dismissible:cache:"' });
  });

  it('should replace multiple placeholders embedded in a string', () => {
    const result = substituteVariables(
      { url: 'redis://${HOST:-localhost}:${PORT}/0' },
      { PORT: '6379' },
    );

    expect(result).toEqual({ url: 'redis://localhost:6379/0' });
  });

  it('should throw when the environment variable is not set and has no default', () => {
    expect(() => substituteVariables({ port: '${PORT}' }, {})).toThrow(
      "Environment variable is not set for variable name: 'PORT'",
    );
  });

  it('should substitute values inside arrays', () => {
    const result = substituteVariables({ origins: ['${A}', 'static', '${B:-b}'] }, { A: 'a' });

    expect(result).toEqual({ origins: ['a', 'static', 'b'] });
  });

  it('should leave non-string values untouched', () => {
    const config = { port: 3001, enabled: true, empty: null };

    expect(substituteVariables(config, {})).toEqual(config);
  });

  it('should not mutate the input config', () => {
    const config = { server: { port: '${PORT}' } };

    substituteVariables(config, { PORT: '8080' });

    expect(config).toEqual({ server: { port: '${PORT}' } });
  });

  describe('config references', () => {
    it('should resolve a dotted path to another config value', () => {
      const result = substituteVariables(
        { server: { host: 'localhost' }, url: 'http://${server.host}' },
        {},
      );

      expect(result.url).toBe('http://localhost');
    });

    it('should keep the type of a referenced number or boolean when it is the whole value', () => {
      const result = substituteVariables(
        { server: { port: 3001, enabled: true }, port: '${server.port}', on: '${server.enabled}' },
        {},
      );

      expect(result.port).toBe(3001);
      expect(result.on).toBe(true);
    });

    it('should resolve placeholders within the referenced value', () => {
      const result = substituteVariables(
        { server: { host: '${HOST:-localhost}' }, url: 'http://${server.host}' },
        {},
      );

      expect(result.url).toBe('http://localhost');
    });

    it('should prefer environment variables over config references', () => {
      const result = substituteVariables({ name: 'config', value: '${name}' }, { name: 'env' });

      expect(result.value).toBe('env');
    });

    it('should throw on a circular reference', () => {
      expect(() => substituteVariables({ a: '${b}', b: '${a}' }, {})).toThrow(
        'Circular reference detected',
      );
    });
  });
});
