# Linux how-to

#### &bullet; Terminal #1

Run the following script to setup the following:
1. `test_in` pipe to send input to the electron app
2. `test_out` pipe to receive input from the electron app
3. start the electron app

```bash
mkfifo -m 666 /tmp/test_in
mkfiro -m 666 /tmp/test_out

# if running in repo
cd /path/to/electron-poc
npm i
npm run build:start -- --in /tmp/test_in --out /tmp/test_out

# if running the published application
cd /path/to/unzipped/electron-poc
./electron-poc --in /tmp/test_in --out /tmp/test_out
```

#### &bullet; Terminal #2

For the application to start, the input pipe, `test_in`, must be open for writing.

```bash
cat > /tmp/test_in
# write to the pipe
```

#### &bullet; Terminal #3

For the application to start, the output pipe, `test_out`, must be open for reading.

```bash
cat /tmp/test_out
# application output will appear here
```

# Windows how-to

#### &bullet; Terminal #1

Run the following script to start a bidirectional pipe with a name of `test-server`.

```pwsh
# the powershell script does not have to be run in the repo
# it can be downloaded and run from anywhere
cd C:\path\to\electron-poc
.\test\test-server.ps1
# write to the pipe
```

#### &bullet; Terminal #2
```bash
# if running in repo
cd C:\path\to\electron-poc
npm i
npm run build:start -- --server "\\.\pipe\test-server"

# if running the published application
cd C:\path\to\unzipped\electron-poc
.\electron-poc --server "\\.\pipe\test-server"
```
