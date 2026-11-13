# PostgreSQL test tools
This directory supplies the isolated PostgreSQL harness dependencies for VIONA P0 CI.
Its package files are copied verbatim from the local operator tool directory _tools/pg-test.
Only embedded-postgres and pg are direct dependencies.
The workflow installs them with npm ci inside this directory.
Temporary databases are created and removed by the reviewed PostgreSQL harness.
No credentials, provider keys, or environment files belong in this directory.
