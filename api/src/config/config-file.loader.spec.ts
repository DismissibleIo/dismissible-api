import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadConfigFile } from './config-file.loader';

describe('loadConfigFile', () => {
  let dir: string;

  const writeConfig = (name: string, content: string) => writeFileSync(join(dir, name), content);

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'config-file-loader-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should load a .env.yaml file', () => {
    writeConfig('.env.yaml', 'server:\n  port: 3001\n');

    expect(loadConfigFile({ searchFrom: dir, env: {} })).toEqual({ server: { port: 3001 } });
  });

  it('should load a .env.yml file', () => {
    writeConfig('.env.yml', 'server:\n  port: 3001\n');

    expect(loadConfigFile({ searchFrom: dir, env: {} })).toEqual({ server: { port: 3001 } });
  });

  it('should load a .env.json file', () => {
    writeConfig('.env.json', '{ "server": { "port": 3001 } }');

    expect(loadConfigFile({ searchFrom: dir, env: {} })).toEqual({ server: { port: 3001 } });
  });

  it('should prefer yaml over json', () => {
    writeConfig('.env.yaml', 'source: yaml\n');
    writeConfig('.env.json', '{ "source": "json" }');

    expect(loadConfigFile({ searchFrom: dir, env: {} })).toEqual({ source: 'yaml' });
  });

  it('should prefer the NODE_ENV specific file', () => {
    writeConfig('.env.yaml', 'source: default\n');
    writeConfig('.env.production.yaml', 'source: production\n');

    expect(loadConfigFile({ searchFrom: dir, env: { NODE_ENV: 'production' } })).toEqual({
      source: 'production',
    });
  });

  it('should prefer a NODE_ENV specific json file over a default yaml file', () => {
    writeConfig('.env.yaml', 'source: default\n');
    writeConfig('.env.production.json', '{ "source": "production" }');

    expect(loadConfigFile({ searchFrom: dir, env: { NODE_ENV: 'production' } })).toEqual({
      source: 'production',
    });
  });

  it('should fall back to the default file when there is no NODE_ENV specific file', () => {
    writeConfig('.env.yaml', 'source: default\n');

    expect(loadConfigFile({ searchFrom: dir, env: { NODE_ENV: 'staging' } })).toEqual({
      source: 'default',
    });
  });

  it('should skip empty files', () => {
    writeConfig('.env.production.yaml', '  \n');
    writeConfig('.env.yaml', 'source: default\n');

    expect(loadConfigFile({ searchFrom: dir, env: { NODE_ENV: 'production' } })).toEqual({
      source: 'default',
    });
  });

  it('should substitute environment variables', () => {
    writeConfig('.env.yaml', 'server:\n  port: ${PORT:-3001}\n');

    expect(loadConfigFile({ searchFrom: dir, env: { PORT: '8080' } })).toEqual({
      server: { port: '8080' },
    });
  });

  it('should not substitute environment variables when ignored', () => {
    writeConfig('.env.yaml', 'server:\n  port: ${PORT:-3001}\n');

    expect(
      loadConfigFile({
        searchFrom: dir,
        env: { PORT: '8080' },
        ignoreEnvironmentVariableSubstitution: true,
      }),
    ).toEqual({ server: { port: '${PORT:-3001}' } });
  });

  it('should throw when no configuration file is found', () => {
    expect(() => loadConfigFile({ searchFrom: dir, env: {} })).toThrow(
      `Failed to find configuration file in '${dir}'.`,
    );
  });

  it.each(['.env.toml', '.env.js', '.env.production.toml'])(
    'should throw a helpful error when only an unsupported %s file is found',
    (name) => {
      writeConfig(name, 'content');

      expect(() => loadConfigFile({ searchFrom: dir, env: { NODE_ENV: 'production' } })).toThrow(
        `Found configuration file '${join(dir, name)}', but only .yaml, .yml, .json configuration files are supported. Please convert it to YAML.`,
      );
    },
  );

  it('should ignore unsupported files when a supported file is found', () => {
    writeConfig('.env.toml', 'source = "toml"');
    writeConfig('.env.yaml', 'source: yaml\n');

    expect(loadConfigFile({ searchFrom: dir, env: {} })).toEqual({ source: 'yaml' });
  });

  it('should throw with the file path when the file cannot be parsed', () => {
    writeConfig('.env.json', '{ invalid');

    expect(() => loadConfigFile({ searchFrom: dir, env: {} })).toThrow(
      `Failed to parse configuration file '${join(dir, '.env.json')}'`,
    );
  });

  it('should throw when the file does not contain an object', () => {
    writeConfig('.env.yaml', '- a\n- b\n');

    expect(() => loadConfigFile({ searchFrom: dir, env: {} })).toThrow('must contain an object');
  });
});
