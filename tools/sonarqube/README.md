# Local SonarQube Setup

This is a local development SonarQube instance for developers who want a local static analysis dashboard without internet or SonarCloud access.

CI analysis uses SonarCloud (sonarcloud.io) — see `sonar-project.properties` and `.github/workflows/full-test.yml` at the project root. This setup does NOT replace that.

## Prerequisites

- Docker and Docker Compose installed
- `vm.max_map_count` must be at least 262144 (required by Elasticsearch inside SonarQube)

Check current value:

```
sysctl vm.max_map_count
```

Set it (takes effect until next reboot):

```
sudo sysctl -w vm.max_map_count=262144
```

Make it permanent (Linux):

```
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Start and Stop

Start (detached):

```
docker compose -f tools/sonarqube/docker-compose.yml up -d
```

Stop (keep data volumes):

```
docker compose -f tools/sonarqube/docker-compose.yml down
```

Stop and delete all data:

```
docker compose -f tools/sonarqube/docker-compose.yml down -v
```

## Access

Open http://localhost:9000 in your browser.

Default credentials: `admin` / `admin`

SonarQube will prompt you to change the password on first login.

## First-Time Project Setup

1. Log in at http://localhost:9000
2. Click "Create a local project"
3. Set project key to `boyuan-oa` and display name to `boyuan-oa`
4. Select "Use the global setting" for the new code definition
5. Go to Account > Security > Generate Token, name it `local-dev`, copy the token

## Running Analysis

Run from the project root after starting the local instance:

```
cd server && mvn verify sonar:sonar \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=<your-token>
```

Replace `<your-token>` with the token generated in the step above.

Results appear at http://localhost:9000/dashboard?id=boyuan-oa

## Notes

- First startup takes 1-2 minutes for SonarQube to initialize. Wait until the UI is accessible before running analysis.
- Data is persisted in Docker named volumes (`sonar_data`, `sonar_db`). It survives `docker compose down` but not `docker compose down -v`.
- CI analysis (SonarCloud) is separate and configured in `sonar-project.properties`. Do not modify that file for local use.
