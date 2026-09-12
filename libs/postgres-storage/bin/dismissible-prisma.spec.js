const childProcess = require('child_process');
const path = require('path');

describe('dismissible-prisma CLI', () => {
  const originalArgv = process.argv;
  let execFileSync;

  beforeEach(() => {
    execFileSync = jest.spyOn(childProcess, 'execFileSync').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.argv = originalArgv;
    jest.restoreAllMocks();
  });

  function run(args) {
    process.argv = [process.execPath, __filename, ...args];
    jest.isolateModules(() => require('./dismissible-prisma'));
  }

  it('uses the installed CLI and preserves schema paths with spaces without a shell', () => {
    run(['generate', '--schema', '/tmp/custom schema/schema.prisma']);
    expect(execFileSync).toHaveBeenCalledWith(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'generate',
        '--schema',
        '/tmp/custom schema/schema.prisma',
        '--config',
        path.join(__dirname, '..', 'prisma.config.mjs'),
      ],
      { stdio: 'inherit' },
    );
  });

  it.each([['--config', '/tmp/custom config.mjs'], ['--config=/tmp/custom config.mjs']])(
    'honors an explicit custom config: %s',
    (...configArgs) => {
      run(['migrate', 'deploy', ...configArgs]);
      expect(execFileSync).toHaveBeenCalledWith(
        process.execPath,
        [require.resolve('prisma/build/index.js'), 'migrate', 'deploy', ...configArgs],
        { stdio: 'inherit' },
      );
    },
  );

  it('propagates a failed Prisma command exit status', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
    execFileSync.mockImplementation(() => {
      throw Object.assign(new Error('Migration failed'), { status: 2 });
    });
    run(['migrate', 'deploy']);
    expect(exit).toHaveBeenCalledWith(2);
  });
});
